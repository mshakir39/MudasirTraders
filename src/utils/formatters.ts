export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-PK').format(num);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export const removeParentheses = (text: string): string => {
  if (!text) return text;
  return text.replace(/\([^)]*\)/g, '').trim();
};
