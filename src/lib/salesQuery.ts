export const SALES_BATCH_SIZE = 10;

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
}) {
  const filter: Record<string, unknown> = {};

  if (options?.customerName) {
    filter.customerName = options.customerName;
  }

  if (options?.startDate && options?.endDate) {
    filter.$or = [
      { date: { $gte: options.startDate, $lte: options.endDate } },
      { createdAt: { $gte: options.startDate, $lte: options.endDate } },
      { saleDate: { $gte: options.startDate, $lte: options.endDate } },
    ];
  }

  return filter;
}
