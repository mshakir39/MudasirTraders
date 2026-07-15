import {
  getPendingInvoiceLookupId,
  shouldFetchPendingInvoices,
} from './pendingInvoiceUtils';

describe('pending invoice lookup helpers', () => {
  it('returns an empty lookup id when no customer has been selected', () => {
    expect(getPendingInvoiceLookupId({ customerName: 'Walk-in' })).toBe('');
    expect(shouldFetchPendingInvoices({ customerName: 'Walk-in' })).toBe(false);
  });

  it('returns the selected client id when a customer has been chosen', () => {
    expect(getPendingInvoiceLookupId({ clientId: ' 123abc ' })).toBe('123abc');
    expect(shouldFetchPendingInvoices({ clientId: '123abc' })).toBe(true);
  });
});
