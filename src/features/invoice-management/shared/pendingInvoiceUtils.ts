export interface PendingInvoiceLookupInput {
  clientId?: string | null;
  customerName?: string | null;
}

export function getPendingInvoiceLookupId(
  invoiceData: PendingInvoiceLookupInput
): string {
  return (invoiceData.clientId?.toString().trim() || '').trim();
}

export function shouldFetchPendingInvoices(
  invoiceData: PendingInvoiceLookupInput
): boolean {
  return getPendingInvoiceLookupId(invoiceData).length > 0;
}
