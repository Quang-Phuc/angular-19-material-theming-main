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

  parse(value: any): number {
    console.log('CurrencyService.parse() nhận giá trị:', value, ' - kiểu:', typeof value);
    if (!value) return 0;
    if (typeof value !== 'string') {
      // nếu là số thì trả về luôn
      if (typeof value === 'number') return value;
      // nếu không phải chuỗi cũng không phải số, log thêm để debug
      console.warn('Giá trị không hợp lệ:', value);
      return 0;
    }
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  }

}
