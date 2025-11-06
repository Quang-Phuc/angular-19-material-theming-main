import { Directive, HostListener, ElementRef, Renderer2, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyFormat]',
  standalone: true
})
export class CurrencyFormatDirective {
  @Input() allowZero: boolean = true;

  private lastValidValue: number = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private control: NgControl
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^0-9]/g, '');

    const numValue = value ? parseInt(value, 10) : 0;

    if (!this.allowZero && numValue === 0) {
      this.control.control?.setValue(null, { emitEvent: false });
      input.value = '';
      return;
    }

    this.lastValidValue = numValue;
    this.control.control?.setValue(numValue, { emitEvent: false });
    input.value = this.formatCurrency(numValue);
  }

  @HostListener('blur', ['$event.target'])
  onBlur(): void {
    const rawValue = this.control.control?.value;
    const input = this.el.nativeElement;
    input.value = this.formatCurrency(rawValue);
  }

  @HostListener('focus')
  onFocus(): void {
    const input = this.el.nativeElement;
    const rawValue = this.control.control?.value;
    if (rawValue !== null && rawValue !== undefined) {
      input.value = rawValue.toString().replace(/,/g, '');
    }
  }

  private formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    return value.toLocaleString('vi-VN');
  }

  // Gọi từ bên ngoài để format lại (khi patchValue)
  formatDisplay(): void {
    const rawValue = this.control.control?.value;
    const input = this.el.nativeElement;
    input.value = this.formatCurrency(rawValue);
  }
}
