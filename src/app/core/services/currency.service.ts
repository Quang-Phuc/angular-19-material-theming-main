import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  format(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
    return isNaN(num) ? '' : num.toLocaleString('vi-VN');
  }

  parse(value: string): number {
    if (!value) return 0;
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  }
}
