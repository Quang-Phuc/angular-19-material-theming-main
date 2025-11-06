import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vnd',
  standalone: true
})
export class VndPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
    return isNaN(num) ? '' : num.toLocaleString('vi-VN');
  }
}
