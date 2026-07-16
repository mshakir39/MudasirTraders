export const CUSTOMERS_BATCH_SIZE = 20;

export type CustomerTabFilter = 'all' | 'regular' | 'walkin';

export function customerTypeFromTab(
  tab: CustomerTabFilter
): string | undefined {
  if (tab === 'regular') return 'Regular Customer';
  if (tab === 'walkin') return 'WalkIn Customer';
  return undefined;
}

export function buildCustomersFilter(options?: {
  customerType?: string;
  search?: string;
}) {
  const filter: Record<string, unknown> = {};

  if (options?.customerType) {
    filter.customerType = options.customerType;
  }

  const search = options?.search?.trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    filter.$or = [
      { customerName: regex },
      { phoneNumber: regex },
      { address: regex },
      { email: regex },
    ];
  }

  return filter;
}
