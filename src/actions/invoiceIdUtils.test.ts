import { ObjectId } from 'mongodb';
import { normalizeInvoiceIdForMongo } from './invoiceIdUtils';

describe('normalizeInvoiceIdForMongo', () => {
  it('converts a valid string id into an ObjectId', () => {
    const stringId = '507f1f77bcf86cd799439011';

    const result = normalizeInvoiceIdForMongo(stringId);

    expect(result).toBeInstanceOf(ObjectId);
    expect(result?.toString()).toBe(stringId);
  });

  it('returns null for an invalid id string', () => {
    expect(normalizeInvoiceIdForMongo('not-a-valid-id')).toBeNull();
  });

  it('returns the existing ObjectId unchanged', () => {
    const objectId = new ObjectId();

    expect(normalizeInvoiceIdForMongo(objectId)).toBe(objectId);
  });
});
