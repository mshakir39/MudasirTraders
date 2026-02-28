import {
  createDealer,
  getDealers,
  getDealerById,
  updateDealer,
  deleteDealer,
  toggleDealerStatus,
} from '@/actions/dealerActions';

// Mock the executeOperation function
jest.mock('@/app/libs/executeOperation', () => ({
  executeOperation: jest.fn(),
}));

const mockExecuteOperation =
  require('@/app/libs/executeOperation').executeOperation;

describe('Dealer Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDealer', () => {
    it('should create a dealer successfully', async () => {
      const dealerData = {
        name: 'Test Dealer',
        contactPerson: 'John Doe',
        phone: '1234567890',
        email: 'test@example.com',
        address: '123 Test St',
        businessType: 'Battery Supplier',
        notes: 'Test notes',
      };

      const expectedDealer = {
        ...dealerData,
        isActive: true,
        totalBills: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      mockExecuteOperation.mockResolvedValue({ insertedId: '123' });

      const result = await createDealer(dealerData);

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealers',
        'insertOne',
        expectedDealer
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ insertedId: '123' });
    });

    it('should handle create dealer error', async () => {
      const dealerData = {
        name: 'Test Dealer',
        contactPerson: 'John Doe',
        phone: '1234567890',
        email: 'test@example.com',
        address: '123 Test St',
        businessType: 'Battery Supplier',
        notes: 'Test notes',
      };

      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await createDealer(dealerData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getDealers', () => {
    it('should get all dealers successfully', async () => {
      const mockDealers = [
        { id: '1', name: 'Dealer 1' },
        { id: '2', name: 'Dealer 2' },
      ];

      mockExecuteOperation.mockResolvedValue(mockDealers);

      const result = await getDealers();

      expect(mockExecuteOperation).toHaveBeenCalledWith('dealers', 'findAll');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDealers);
    });

    it('should handle get dealers error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await getDealers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getDealerById', () => {
    it('should get dealer by id successfully', async () => {
      const mockDealer = { id: '1', name: 'Dealer 1' };

      mockExecuteOperation.mockResolvedValue(mockDealer);

      const result = await getDealerById('1');

      expect(mockExecuteOperation).toHaveBeenCalledWith('dealers', 'findOne', {
        id: '1',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDealer);
    });

    it('should handle get dealer by id error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await getDealerById('1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateDealer', () => {
    it('should update dealer successfully', async () => {
      const updateData = {
        name: 'Updated Dealer',
        contactPerson: 'Jane Doe',
      };

      const expectedUpdate = {
        documentId: '1',
        ...updateData,
        updatedAt: expect.any(Date),
      };

      mockExecuteOperation.mockResolvedValue({ modifiedCount: 1 });

      const result = await updateDealer('1', updateData);

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealers',
        'updateOne',
        expectedUpdate
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ modifiedCount: 1 });
    });

    it('should handle update dealer error', async () => {
      const updateData = {
        name: 'Updated Dealer',
      };

      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await updateDealer('1', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('deleteDealer', () => {
    it('should delete dealer and related bills successfully', async () => {
      const mockBills = [
        {
          id: 'bill1',
          billImageUrl: 'http://example.com/image1.jpg',
          payments: [
            { transactionImageUrl: 'http://example.com/payment1.jpg' },
          ],
        },
      ];

      mockExecuteOperation
        .mockResolvedValueOnce(mockBills) // find bills
        .mockResolvedValueOnce({}) // delete bill
        .mockResolvedValueOnce({}); // delete dealer

      const result = await deleteDealer('1');

      expect(mockExecuteOperation).toHaveBeenCalledWith('dealerBills', 'find', {
        dealerId: '1',
      });
      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealerBills',
        'delete',
        { documentId: 'bill1' }
      );
      expect(mockExecuteOperation).toHaveBeenCalledWith('dealers', 'delete', {
        documentId: '1',
      });
      expect(result.success).toBe(true);
    });

    it('should delete dealer without bills', async () => {
      mockExecuteOperation
        .mockResolvedValueOnce([]) // no bills
        .mockResolvedValueOnce({}); // delete dealer

      const result = await deleteDealer('1');

      expect(mockExecuteOperation).toHaveBeenCalledWith('dealerBills', 'find', {
        dealerId: '1',
      });
      expect(mockExecuteOperation).toHaveBeenCalledWith('dealers', 'delete', {
        documentId: '1',
      });
      expect(result.success).toBe(true);
    });

    it('should handle delete dealer error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await deleteDealer('1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('toggleDealerStatus', () => {
    it('should toggle dealer status successfully', async () => {
      const expectedUpdate = {
        documentId: '1',
        isActive: false,
        updatedAt: expect.any(Date),
      };

      mockExecuteOperation.mockResolvedValue({ modifiedCount: 1 });

      const result = await toggleDealerStatus('1', false);

      expect(mockExecuteOperation).toHaveBeenCalledWith(
        'dealers',
        'updateOne',
        expectedUpdate
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ modifiedCount: 1 });
    });

    it('should handle toggle dealer status error', async () => {
      const error = new Error('Database error');
      mockExecuteOperation.mockRejectedValue(error);

      const result = await toggleDealerStatus('1', true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
