export function formatCurrency(value: number | null | undefined, suffix = '₫'): string {
  if (value == null || isNaN(+value)) return '0' + suffix;
  return value.toLocaleString('vi-VN') + (suffix ? ` ${suffix}` : '');
}
