'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { GET, POST } from '@/utils/api';
import { IDealer } from '@/interfaces';
import Modal from '@/components/modal';
import Button from '@/components/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DeleteDealerModal } from '@/components/dealers/DeleteDealerModal';
import DealerCard from '@/components/dealers/DealerCard';
import DealerStats from '@/components/dealers/DealerStats';
import AddDealerModal from '@/components/dealers/AddDealerModal';
import DealerBillsModal from '@/components/dealers/DealerBillsModal';
import PaymentModal from '@/components/dealers/PaymentModal';

const DealersPage: React.FC = () => {
  const router = useRouter();
  const [dealers, setDealers] = useState<IDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<IDealer | null>(null);
  const [isBillsModalOpen, setIsBillsModalOpen] = useState(false);
  const [selectedDealerForBills, setSelectedDealerForBills] =
    useState<IDealer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCurrentOnly, setShowCurrentOnly] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDealerForPayment, setSelectedDealerForPayment] =
    useState<IDealer | null>(null);
  const [dealerBills, setDealerBills] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dealerToDelete, setDealerToDelete] = useState<IDealer | null>(null);

  const calculateStats = useCallback(
    (bills: any[] = [], currentDealers: IDealer[] = []) => {
      const filteredBills =
        dateRange.startDate || dateRange.endDate
          ? bills.filter((bill) => {
              const billDate = new Date(bill.billDate);
              const start = dateRange.startDate
                ? new Date(dateRange.startDate)
                : new Date('1900-01-01');
              const end = dateRange.endDate
                ? new Date(dateRange.endDate)
                : new Date('2100-12-31');
              return billDate >= start && billDate <= end;
            })
          : bills;

      const stats = {
        totalDealers: currentDealers.length,
        activeDealers: currentDealers.filter((d) => d.isActive).length,
        inactiveDealers: currentDealers.filter((d) => !d.isActive).length,
        totalBills: filteredBills.length,
        totalPaid: filteredBills.reduce((sum, bill) => {
          const billPaid =
            bill.payments?.reduce((paymentSum: number, payment: any) => {
              const paymentDate = new Date(payment.paymentDate);
              if (dateRange.startDate || dateRange.endDate) {
                const start = dateRange.startDate
                  ? new Date(dateRange.startDate)
                  : new Date('1900-01-01');
                const end = dateRange.endDate
                  ? new Date(dateRange.endDate)
                  : new Date('2100-12-31');
                if (paymentDate < start || paymentDate > end) return paymentSum;
              }
              return paymentSum + (payment.paymentAmount || 0);
            }, 0) || 0;
          return sum + billPaid;
        }, 0),
        totalOutstanding: currentDealers.reduce(
          (sum, dealer) => sum + (dealer.currentBillOutstanding || 0),
          0
        ),
      };

      return stats;
    },
    [dateRange]
  );

  const [overallStats, setOverallStats] = useState(calculateStats([], []));

  const fetchDealers = useCallback(async () => {
    try {
      const response = await GET('api/dealers');
      if (response.error) {
        toast.error(response.error);
      } else {
        setDealers(response.dealers || []);

        const billsResponse = await GET('api/dealer-bills');
        if (!billsResponse.error && billsResponse.bills) {
          const updatedDealers = response.dealers.map((dealer: IDealer) => {
            const dealerBills = billsResponse.bills.filter(
              (bill: any) => bill.dealerId === dealer.id
            );

            const currentBill =
              dealerBills.find((bill: any) => bill.isCurrent) ||
              dealerBills.sort(
                (a: any, b: any) =>
                  new Date(b.billDate).getTime() -
                  new Date(a.billDate).getTime()
              )[0];

            console.log(`Dealer ${dealer.id} - Current bill:`, currentBill);
            console.log(
              `Dealer ${dealer.id} - All bills with isCurrent:`,
              dealerBills.map((b: any) => ({
                id: b.id,
                isCurrent: b.isCurrent,
                totalAmount: b.totalAmount,
                remainingAmount: b.remainingAmount,
              }))
            );

            const totalBillsCount = dealerBills.length;
            const totalPaidAllTime = dealerBills.reduce(
              (sum: number, bill: any) => {
                const billPaid =
                  bill.payments?.reduce(
                    (paymentSum: number, payment: any) =>
                      paymentSum + (payment.paymentAmount || 0),
                    0
                  ) || 0;
                return sum + billPaid;
              },
              0
            );

            const allPayments = dealerBills.flatMap(
              (bill: any) => bill.payments || []
            );
            const latestPayment = allPayments.sort(
              (a: any, b: any) =>
                new Date(b.paymentDate).getTime() -
                new Date(a.paymentDate).getTime()
            )[0];
            const lastPaymentDate = latestPayment
              ? new Date(latestPayment.paymentDate).toLocaleString()
              : 'No payments';
            const firstPayment = allPayments.sort(
              (a: any, b: any) =>
                new Date(a.paymentDate).getTime() -
                new Date(b.paymentDate).getTime()
            )[0];
            const firstPaymentDate = firstPayment
              ? new Date(firstPayment.paymentDate).toLocaleString()
              : 'No payments';

            return {
              ...dealer,
              totalBillsCount,
              totalPaidAllTime,
              currentBillId: currentBill?.id,
              currentBillAmount: currentBill?.totalAmount,
              currentBillOutstanding: currentBill?.remainingAmount,
              currentBillDueDate: currentBill?.dueDate
                ? new Date(currentBill.dueDate).toLocaleDateString()
                : undefined,
              isOverdue: currentBill?.dueDate
                ? new Date(currentBill.dueDate) < new Date()
                : false,
              lastPaymentDate,
              firstPaymentDate,
            };
          });
          setDealers(updatedDealers);
          setOverallStats(calculateStats(billsResponse.bills, updatedDealers));
        } else {
          setDealers(response.dealers || []);
          setOverallStats(calculateStats([], response.dealers || []));
        }
      }
    } catch (error) {
      toast.error('Failed to fetch dealers');
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    const updateStats = async () => {
      const billsResponse = await GET('api/dealer-bills');
      if (!billsResponse.error && billsResponse.bills) {
        const stats = calculateStats(billsResponse.bills, dealers);
        setOverallStats(stats);
      }
    };

    if (dealers.length > 0) {
      updateStats();
    }
  }, [
    dateRange.startDate,
    dateRange.endDate,
    dateRange,
    calculateStats,
    dealers,
  ]);

  useEffect(() => {
    if (dealers.length > 0) {
      const updateStats = async () => {
        const billsResponse = await GET('api/dealer-bills');
        if (!billsResponse.error && billsResponse.bills) {
          const stats = calculateStats(billsResponse.bills, dealers);
          setOverallStats(stats);
        }
      };
      updateStats();
    }
  }, [dealers.length, calculateStats, dealers]);

  const fetchDealerBills = async (dealerId: string) => {
    try {
      const response = await GET('api/dealer-bills');

      if (response.error) {
        toast.error(response.error);
      } else {
        const bills =
          response.bills?.filter((bill: any) => bill.dealerId === dealerId) ||
          [];
        setDealerBills(bills);
        return bills;
      }
    } catch (error) {
      toast.error('Failed to fetch bills');
      return [];
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  const handleToggleStatus = async (dealer: IDealer) => {
    try {
      const response = await POST('api/dealers', {
        action: 'toggleStatus',
        dealerId: dealer.id,
        isActive: !dealer.isActive,
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(
          `Dealer ${!dealer.isActive ? 'activated' : 'deactivated'} successfully`
        );
        fetchDealers();
      }
    } catch (error) {
      toast.error('Failed to update dealer status');
    }
  };

  const handleDeleteDealer = (dealer: IDealer) => {
    setDealerToDelete(dealer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDealer = async () => {
    if (!dealerToDelete?.id) return;

    try {
      const response = await fetch(`/api/dealers?id=${dealerToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Dealer deleted successfully');
        fetchDealers();
        setIsDeleteModalOpen(false);
        setDealerToDelete(null);
      }
    } catch (error) {
      toast.error('Failed to delete dealer');
    }
  };

  const handleAddBill = (dealer: IDealer) => {
    setSelectedDealerForBills(dealer);
    setIsBillsModalOpen(true);
    setShowAddForm(true);
  };

  const handleAddPayment = async (dealer: IDealer) => {
    if (!dealer.id) return;
    setSelectedDealerForPayment(dealer);
    await fetchDealerBills(dealer.id);
    setIsPaymentModalOpen(true);
  };

  const handleViewDetails = (dealer: IDealer) => {
    setSelectedDealerForBills(dealer);
    setIsBillsModalOpen(true);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
        <LoadingSpinner size='lg' />
        <div className='text-center'>
          <h2 className='text-lg font-medium text-secondary-900'>
            Loading Dealers...
          </h2>
          <p className='mt-1 text-sm text-secondary-500'>
            Please wait while we fetch your dealer data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-0 py-6 md:p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-secondary-900'>Dealers</h1>
        <Button
          variant='fill'
          text='Add New Dealer'
          icon={<FaPlus />}
          onClick={() => {
            setEditingDealer(null);
            setIsAddModalOpen(true);
          }}
        />
      </div>

      <DealerStats
        overallStats={overallStats}
        dateRange={dateRange}
        onClearFilter={() => setDateRange({ startDate: '', endDate: '' })}
      />

      {dealers.length === 0 ? (
        <div className='py-12 text-center'>
          <div className='mx-auto mb-4 h-12 w-12 text-secondary-400'>
            <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
          </div>
          <h3 className='mb-2 text-lg font-medium text-secondary-900'>
            No dealers yet
          </h3>
          <p className='text-secondary-500'>
            Start by adding your first dealer using the &ldquo;Add New
            Dealer&rdquo; button above
          </p>
        </div>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {dealers.map((dealer) => (
            <DealerCard
              key={dealer.id}
              dealer={dealer}
              onEdit={(dealer) => {
                setEditingDealer(dealer);
                setIsAddModalOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteDealer}
              onAddBill={handleAddBill}
              onAddPayment={handleAddPayment}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <AddDealerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDealer(null);
        }}
        onDealerAdded={fetchDealers}
        editingDealer={editingDealer}
      />

      <Modal
        isOpen={isBillsModalOpen}
        onClose={() => {
          setIsBillsModalOpen(false);
          setSelectedDealerForBills(null);
        }}
        title={`Bills for ${selectedDealerForBills?.dealerName || 'Dealer'}`}
        dialogPanelClass='!w-[98%] sm:!w-[95%] md:!w-[90%] lg:!w-[85%]'
        size='large'
        dynamicHeight={true}
      >
        <DealerBillsModal
          dealerId={selectedDealerForBills?.id || ''}
          showAddForm={showAddForm}
          onShowAddFormChange={setShowAddForm}
          showCurrentOnly={showCurrentOnly}
          onShowCurrentOnlyChange={setShowCurrentOnly}
          router={router}
          onClose={() => {
            setIsBillsModalOpen(false);
            setSelectedDealerForBills(null);
            // Fetch dealers immediately to update current bill info
            fetchDealers();
          }}
        />
      </Modal>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedDealerForPayment(null);
          setDealerBills([]);
        }}
        onPaymentAdded={async () => {
          await fetchDealers();
          if (selectedDealerForPayment?.id) {
            await fetchDealerBills(selectedDealerForPayment.id);
          }
        }}
        dealerId={selectedDealerForPayment?.id || ''}
        bills={dealerBills}
      />

      <DeleteDealerModal
        isOpen={isDeleteModalOpen}
        isLoading={loading}
        dealerToDelete={dealerToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDealerToDelete(null);
        }}
        onConfirm={confirmDeleteDealer}
      />
    </div>
  );
};

export default DealersPage;
