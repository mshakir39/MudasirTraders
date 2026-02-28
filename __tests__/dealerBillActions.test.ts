import {
  createDealerBill,
  getDealerBills,
  getDealerBillById,
  addPaymentToBill,
  deleteDealerBill,
} from '@/actions/dealerBillActions';

// Mock the executeOperation function
jest.mock('@/app/libs/executeOperation', () => ({
  executeOperation: jest.fn(),
}));

const mockExecuteOperation =
  require('@/app/libs/executeOperation').executeOperation;

// Mock mongodb ObjectId
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
  ObjectId: jest.fn().mockImplementation((id) => ({ _id: id })),
}));

describe('Dealer Bill Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDealerBill', () => {
    it('should create a dealer bill successfully', async () => {
      const billData = {
        dealerId: 'dealer1',
        dealerName: 'Test Dealer',
        billDate: new Date('2023-01-01'),
        totalAmount: 1000,
        billImageUrl: 'http://example.com/bill.jpg',
        notes: 'Test bill',
      };

      const expectedBill = {
        dealerId: 'dealer1',
        dealerName: 'Test Dealer',
        invoiceNo: '',
        billDate: new Date('2023-01-01'),
        totalAmount: 1000,
        billImageUrl: 'http://example.com/bill.jpg',
        status: 'unpaid',
        payments: [],
        remainingAmount: 1000,
        notes: 'Test bill',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockExecuteOperation.mockResolvedValue({ insertedId: 'bill123' });

      const result = await createDealerBill(billData);

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'insertOne',
        expectedBill
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ insertedId: 'bill123' });
    });

    it('should handle create dealer bill error', async () => {
      const billData = {
        dealerId: 'dealer1',
        dealerName: 'Test Dealer',
        billDate: new Date('2023-01-01'),
        totalAmount: 1000,
        billImageUrl: 'http://example.com/bill.jpg',
        notes: 'Test bill',
      };

      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await createDealerBill(billData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getDealerBills', () => {
    it('should get all dealer bills successfully', async () => {
      const mockBills = [
        { id: 'bill1', dealerId: 'dealer1' },
        { id: 'bill2', dealerId: 'dealer2' },
      ];

      mockExecuteOperation.mockResolvedValue(mockBills);

      const result = await getDealerBills();

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'findAll'
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBills);
    });

    it('should handle get dealer bills error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await getDealerBills();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getDealerBillById', () => {
    it('should get dealer bill by id successfully', async () => {
      const mockBill = { id: 'bill1', dealerId: 'dealer1' };

      mockExecuteOperation.mockResolvedValue(mockBill);

      const result = await getDealerBillById('bill1');

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'findOne',
        { id: 'bill1' }
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBill);
    });

    it('should handle get dealer bill by id error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await getDealerBillById('bill1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('addPaymentToBill', () => {
    it('should add payment to bill successfully', async () => {
      const paymentData = {
        billId: 'bill1',
        paymentDate: new Date('2023-01-01'),
        paymentAmount: 500,
        paymentMethod: 'cash',
        transactionImageUrl: '',
        notes: 'Test payment',
        receivedBy: 'John Doe',
      };

      const mockBill = {
        _id: 'bill1',
        totalAmount: 1000,
        payments: [],
      };

      const expectedUpdatedPayments = [
        {
          id: expect.any(String),
          paymentDate: new Date('2023-01-01'),
          paymentAmount: 500,
          paymentMethod: 'cash',
          transactionImageUrl: '',
          notes: 'Test payment',
          receivedBy: 'John Doe',
          createdAt: expect.any(Date),
        },
      ];

      const expectedUpdate = {
        documentId: 'bill1',
        payments: expectedUpdatedPayments,
        remainingAmount: 500,
        status: 'partial',
        updatedAt: expect.any(Date),
      };

      mockExecuteOperation
        .mockResolvedValueOnce(mockBill)
        .mockResolvedValueOnce({ modifiedCount: 1 });

      const result = await addPaymentToBill(paymentData);

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'findOne',
        { _id: expect.any(Object) }
      );
      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'updateOne',
        expectedUpdate
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ modifiedCount: 1 });
    });

    it('should handle bill not found', async () => {
      const paymentData = {
        billId: 'bill1',
        paymentDate: new Date('2023-01-01'),
        paymentAmount: 500,
        paymentMethod: 'cash',
        transactionImageUrl: '',
        notes: 'Test payment',
        receivedBy: 'John Doe',
      };

      mockExecuteOperation.mockResolvedValueOnce(null);

      const result = await addPaymentToBill(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bill not found');
    });

    it('should handle add payment error', async () => {
      const paymentData = {
        billId: 'bill1',
        paymentDate: new Date('2023-01-01'),
        paymentAmount: 500,
        paymentMethod: 'cash',
        transactionImageUrl: '',
        notes: 'Test payment',
        receivedBy: 'John Doe',
      };

      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await addPaymentToBill(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('deleteDealerBill', () => {
    it('should delete dealer bill successfully', async () => {
      mockExecuteOperation.mockResolvedValue({ deletedCount: 1 });

      const result = await deleteDealerBill('bill1');

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'delete',
        { documentId: 'bill1' }
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ deletedCount: 1 });
    });

    it('should handle delete dealer bill error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await deleteDealerBill('bill1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
