'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { categoriesAtom } from '@/store/sharedAtoms';
import { ICategory } from '@/interfaces';
import { DraggableTabs } from '@/components/stock/DraggableTabs';
import {
  FaShieldAlt,
  FaPlus,
  FaSearch,
  FaFileInvoice,
  FaCheckCircle,
  FaTruck,
  FaClock,
  FaPrint,
  FaCarBattery,
  FaTimesCircle,
  FaTrash,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '@/components/modal';
import Button from '@/components/button';
import CreateClaimModal from '@/components/claims/CreateClaimModal';
import ClaimReceiptModal from '@/components/claims/ClaimReceiptModal';

export default function ClaimsDashboard() {
  const [claims, setClaims] = useState<any[]>([]);
  const [stockList, setStockList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClaimForReceipt, setSelectedClaimForReceipt] = useState<any | null>(null);

  // Status Change Confirmation Modal (No window.confirm or alert)
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    claimId: string;
    newStatus: string;
    claimNumber?: string;
  } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Claim Confirmation Modal
  const [pendingClaimDelete, setPendingClaimDelete] = useState<{
    claimId: string;
    claimNumber?: string;
    supplierStatus?: string;
    replacementBrand?: string;
    replacementSeries?: string;
  } | null>(null);
  const [isDeletingClaim, setIsDeletingClaim] = useState(false);

  // Fetch Claims
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/claims?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setClaims(json.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to load claims: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // Fetch available stock for dropdowns
  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setStockList(json.data);
      }
    } catch (err) {
      console.error('Failed to load stock list:', err);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Status changer trigger (opens custom confirmation modal instead of browser alert/confirm)
  const requestStatusUpdate = (claimId: string, newStatus: string, claimNumber?: string) => {
    setPendingStatusUpdate({ claimId, newStatus, claimNumber });
  };

  // Execute the confirmed status update
  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;
    const { claimId, newStatus } = pendingStatusUpdate;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Status updated successfully');
        setPendingStatusUpdate(null);
        fetchClaims();
        fetchStock();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Execute the confirmed claim deletion
  const confirmDeleteClaim = async () => {
    if (!pendingClaimDelete) return;
    const { claimId } = pendingClaimDelete;

    setIsDeletingClaim(true);
    try {
      const res = await fetch(`/api/claims?claimId=${encodeURIComponent(claimId)}&restoreStock=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Claim deleted successfully');
        setPendingClaimDelete(null);
        fetchClaims();
        fetchStock();
      } else {
        toast.error(data.error || 'Failed to delete claim');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting claim');
    } finally {
      setIsDeletingClaim(false);
    }
  };

  // Categories from global atom or API fallback
  const [globalCategories] = useAtom(categoriesAtom);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [orderedCategories, setOrderedCategories] = useState<ICategory[]>([]);
  const [currentBrandName, setCurrentBrandName] = useState<string>('All');

  // Load categories if globalCategories is empty
  useEffect(() => {
    if (globalCategories && globalCategories.length > 0) {
      setCategories(globalCategories);
      setOrderedCategories(globalCategories);
    } else {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((result) => {
          if (result.success && Array.isArray(result.data)) {
            setCategories(result.data);
            setOrderedCategories(result.data);
          }
        })
        .catch((err) => console.error('Error fetching categories in claims:', err));
    }
  }, [globalCategories]);

  // Filter claims based on selected category / brand tab
  const filteredClaims = useMemo(() => {
    if (!currentBrandName || currentBrandName === 'All') {
      return claims;
    }
    const target = currentBrandName.trim().toLowerCase();
    return claims.filter((claim) => {
      const faulty = (claim.faultyBrand || '').trim().toLowerCase();
      const rep = (claim.replacementBrand || '').trim().toLowerCase();
      return faulty === target || rep === target;
    });
  }, [claims, currentBrandName]);

  // KPIs
  const totalClaims = filteredClaims.length;
  const pendingDispatch = filteredClaims.filter((c) => c.supplierStatus === 'PENDING_DISPATCH').length;
  const sentToCompany = filteredClaims.filter((c) => c.supplierStatus === 'SENT_TO_COMPANY').length;
  const receivedFromCompany = filteredClaims.filter((c) => c.supplierStatus === 'RECEIVED_FROM_COMPANY').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
              <FaShieldAlt size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Battery Warranty Claims</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Manage customer replacements, automatic stock deduction & company returns
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm text-sm transition-all"
        >
          <FaPlus size={14} />
          <span>New Warranty Claim</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FaCarBattery size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Claims</div>
            <div className="text-xl font-bold text-gray-900">{totalClaims}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <FaClock size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">In Shop (Pending Dispatch)</div>
            <div className="text-xl font-bold text-yellow-700">{pendingDispatch}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <FaTruck size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Sent to Company</div>
            <div className="text-xl font-bold text-orange-700">{sentToCompany}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <FaCheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Received / Settled (+1 Stock)</div>
            <div className="text-xl font-bold text-green-700">{receivedFromCompany}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search claim #, phone, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_DISPATCH">Pending Dispatch (In Shop)</option>
            <option value="SENT_TO_COMPANY">Sent to Company</option>
            <option value="RECEIVED_FROM_COMPANY">Received from Company (+1 Stock)</option>
            <option value="REJECTED">Rejected by Company</option>
          </select>
        </div>
      </div>

      {/* Tabs - Identical layout to Stock page */}
      <div className="mb-4 rounded-lg bg-white shadow-sm border border-secondary-200">
        <div className="p-4 sm:p-0">
          <div className="flex items-center justify-between">
            <div className="-mx-4 flex-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex border-b border-secondary-200">
                <button
                  type="button"
                  onClick={() => setCurrentBrandName('All')}
                  className={`relative flex flex-shrink-0 cursor-pointer select-none items-center whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-all duration-200 ${
                    currentBrandName === 'All'
                      ? 'border-primary-500 bg-primary-50 text-primary-600 font-semibold'
                      : 'border-transparent text-secondary-500 hover:bg-secondary-50 hover:text-secondary-700'
                  }`}
                >
                  All Brands ({claims.length})
                </button>

                {orderedCategories.length > 0 && (
                  <DraggableTabs
                    categories={orderedCategories}
                    currentBrandName={currentBrandName}
                    onTabClick={(brandName) => setCurrentBrandName(brandName)}
                    onReorder={setOrderedCategories}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Claim Details</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Faulty Battery (Old)</th>
                <th className="py-3 px-4">Replacement Given (New)</th>
                <th className="py-3 px-4">Company Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Loading warranty claims...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <FaCarBattery className="mx-auto text-3xl text-gray-300 mb-2" />
                    {claims.length === 0
                      ? 'No warranty claims found. Click New Warranty Claim to register one.'
                      : `No claims found for ${currentBrandName === 'All' ? 'this filter' : currentBrandName}.`}
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-700">{claim.claimNumber}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(claim.claimDate || claim.createdAt).toLocaleDateString()}
                      </div>
                      {claim.originalInvoiceNumber && (
                        <div className="text-[11px] text-gray-500">Inv: {claim.originalInvoiceNumber}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{claim.customerName}</div>
                      <div className="text-gray-500 text-xs">{claim.customerPhone}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-red-700">
                        {claim.faultyBrand} {claim.faultySeries}
                      </div>
                      <div className="text-xs text-gray-600">S/N: {claim.faultySerial}</div>
                      {claim.issueDescription && (
                        <div className="text-[11px] text-gray-400 truncate max-w-xs">{claim.issueDescription}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-green-700">
                        {claim.replacementBrand} {claim.replacementSeries}
                      </div>
                      <div className="text-xs text-gray-600">S/N: {claim.replacementSerial}</div>
                      <div className="text-[11px] text-green-600 font-semibold">Payment: Rs. 0</div>
                    </td>

                    <td className="py-3 px-4">
                      {claim.supplierStatus === 'PENDING_DISPATCH' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          <FaClock size={10} /> In Shop
                        </span>
                      )}
                      {claim.supplierStatus === 'SENT_TO_COMPANY' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          <FaTruck size={10} /> Sent to Company
                        </span>
                      )}
                      {claim.supplierStatus === 'RECEIVED_FROM_COMPANY' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <FaCheckCircle size={10} /> Received (+1 Stock)
                        </span>
                      )}
                      {claim.supplierStatus === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <FaTimesCircle size={10} /> Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Transition Quick Actions */}
                        {claim.supplierStatus === 'PENDING_DISPATCH' && (
                          <button
                            onClick={() => requestStatusUpdate(claim._id, 'SENT_TO_COMPANY', claim.claimNumber)}
                            title="Mark Sent to Company"
                            className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 px-2 py-1 rounded transition-colors"
                          >
                            Send to Company
                          </button>
                        )}
                        {claim.supplierStatus === 'SENT_TO_COMPANY' && (
                          <button
                            onClick={() => requestStatusUpdate(claim._id, 'RECEIVED_FROM_COMPANY', claim.claimNumber)}
                            title="Mark Received and replenish 1 stock"
                            className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-2 py-1 rounded shadow-sm transition-colors"
                          >
                            +1 Received
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedClaimForReceipt(claim)}
                          title="Print Claim Voucher"
                          className="p-1.5 text-gray-600 hover:text-blue-600 border border-gray-200 rounded hover:bg-gray-100"
                        >
                          <FaPrint size={13} />
                        </button>

                        <button
                          onClick={() =>
                            setPendingClaimDelete({
                              claimId: claim._id,
                              claimNumber: claim.claimNumber,
                              supplierStatus: claim.supplierStatus,
                              replacementBrand: claim.replacementBrand,
                              replacementSeries: claim.replacementSeries,
                            })
                          }
                          title="Delete Claim"
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Status Updates (Replaces window.confirm/alert) */}
      {pendingStatusUpdate && (
        <Modal
          isOpen={!!pendingStatusUpdate}
          onClose={() => setPendingStatusUpdate(null)}
          title="Confirm Status Change"
          size="small"
        >
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                <FaShieldAlt size={22} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  Update Claim Status
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Claim #{pendingStatusUpdate.claimNumber || pendingStatusUpdate.claimId.slice(-6)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
              {pendingStatusUpdate.newStatus === 'RECEIVED_FROM_COMPANY' ? (
                <div className="space-y-1">
                  <p className="font-medium text-green-700">
                    Mark claim as Received from Company?
                  </p>
                  <p className="text-xs text-gray-600">
                    This will automatically add <strong>+1 stock</strong> back to the respective battery series inventory (reimbursed by company).
                  </p>
                </div>
              ) : pendingStatusUpdate.newStatus === 'SENT_TO_COMPANY' ? (
                <div className="space-y-1">
                  <p className="font-medium text-gray-800">
                    Dispatch faulty battery to company?
                  </p>
                  <p className="text-xs text-gray-500">
                    Note: Replacement battery stock was already deducted (-1) when the claim was registered and handed to the customer. No stock will be changed on dispatch.
                  </p>
                </div>
              ) : (
                <p>
                  Are you sure you want to mark this claim as{' '}
                  <span className="font-semibold text-gray-900">
                    {pendingStatusUpdate.newStatus.replace(/_/g, ' ')}
                  </span>
                  ?
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                text="Cancel"
                onClick={() => setPendingStatusUpdate(null)}
                disabled={isUpdatingStatus}
              />
              <Button
                variant="fill"
                text={
                  pendingStatusUpdate.newStatus === 'RECEIVED_FROM_COMPANY'
                    ? 'Confirm (+1 Stock)'
                    : 'Confirm Update'
                }
                onClick={confirmStatusUpdate}
                isPending={isUpdatingStatus}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Claim Deletion (No window.confirm/alert) */}
      {pendingClaimDelete && (
        <Modal
          isOpen={!!pendingClaimDelete}
          onClose={() => setPendingClaimDelete(null)}
          title="Delete Warranty Claim"
          size="small"
        >
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-red-50 text-red-600 flex-shrink-0">
                <FaTrash size={20} />
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  Delete Claim #{pendingClaimDelete.claimNumber || pendingClaimDelete.claimId.slice(-6)}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  This action will permanently delete this claim record.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 space-y-2">
              <p className="font-medium text-amber-950">
                Are you sure you want to delete this claim?
              </p>
              {pendingClaimDelete.supplierStatus !== 'RECEIVED_FROM_COMPANY' ? (
                <p className="text-xs text-amber-800">
                  Since this claim is not yet marked as Received from company, deleting it will restore{' '}
                  <span className="font-semibold text-green-700">+1 unit</span> back to stock for{' '}
                  <span className="font-semibold">
                    {pendingClaimDelete.replacementBrand} {pendingClaimDelete.replacementSeries}
                  </span>.
                </p>
              ) : (
                <p className="text-xs text-amber-800">
                  This claim was already settled and reimbursed by the company. Deleting it will not alter existing stock.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                text="Cancel"
                onClick={() => setPendingClaimDelete(null)}
                disabled={isDeletingClaim}
              />
              <button
                type="button"
                onClick={confirmDeleteClaim}
                disabled={isDeletingClaim}
                className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isDeletingClaim ? 'Deleting...' : 'Delete Claim'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modals */}
      <CreateClaimModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchClaims();
          fetchStock();
        }}
        stockList={stockList}
      />

      <ClaimReceiptModal
        claim={selectedClaimForReceipt}
        isOpen={!!selectedClaimForReceipt}
        onClose={() => setSelectedClaimForReceipt(null)}
      />
    </div>
  );
}
