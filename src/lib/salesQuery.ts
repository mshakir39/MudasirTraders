export const SALES_BATCH_SIZE = 20;

export function getDefaultSalesDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function buildSalesFilter(options?: {
  startDate?: Date;
  endDate?: Date;
  customerName?: string;
  search?: string;
}) {
  const filter: Record<string, unknown> = {};

  if (options?.customerName) {
    filter.customerName = options.customerName;
  }

  const search = options?.search?.trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = { $regex: escaped, $options: 'i' };
    filter.$or = [
      { customerName: regex },
      { 'products.brandName': regex },
      { 'products.series': regex },
      { notes: regex },
      { invoiceId: regex },
    ];
  }

  if (options?.startDate && options?.endDate) {
    const dateConditions = [
      { date: { $gte: options.startDate, $lte: options.endDate } },
      { createdAt: { $gte: options.startDate, $lte: options.endDate } },
      { saleDate: { $gte: options.startDate, $lte: options.endDate } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or as any }, { $or: dateConditions }];
      delete filter.$or;
    } else {
      filter.$or = dateConditions;
    }
  }

  return filter;
}
