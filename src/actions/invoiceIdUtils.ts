import { ObjectId } from 'mongodb';

export function normalizeInvoiceIdForMongo(id: unknown): ObjectId | null {
  if (id instanceof ObjectId) {
    return id;
  }

  if (typeof id === 'string') {
    const trimmedId = id.trim();
    if (ObjectId.isValid(trimmedId)) {
      return new ObjectId(trimmedId);
    }
  }

  return null;
}
