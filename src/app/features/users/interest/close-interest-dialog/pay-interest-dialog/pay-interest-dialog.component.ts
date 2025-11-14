import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { InterestService } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';
import {animate, style, transition, trigger} from '@angular/animations';
import {CurrencyFormatDirective} from '../../../../../core/utils/currency-format.directive';
import {VndPipe} from '../../../../../core/utils/currency.pipe';
import { formatCurrency } from '../../../../../core/utils/format.util';
interface PaymentMethod {
  label: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-pay-interest-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    CurrencyFormatDirective, VndPipe
  ],
  templateUrl: './pay-interest-dialog.component.html',
  styleUrls: ['./pay-interest-dialog.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class PayInterestDialogComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  formatMoney = formatCurrency;
  paymentMethods: PaymentMethod[] = [
    { label: 'Tiền mặt', value: 'cash', icon: 'payments', color: '#4caf50' },
    { label: 'Chuyển khoản', value: 'bank_transfer', icon: 'account_balance', color: '#2196f3' },
    { label: 'Ví điện tử', value: 'ewallet', icon: 'account_balance_wallet', color: '#9c27b0' },
    { label: 'Thẻ tín dụng', value: 'credit_card', icon: 'credit_card', color: '#ff5722' }
  ];

  constructor(
    private fb: FormBuilder,
    private interest: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<PayInterestDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { pledgeId: number; periodNumber: number; id:number,totalAmount: number; }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      payDate: [new Date(), Validators.required],
      paymentMethod: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      note: ['']
    });

    // GÁN GIÁ TRỊ TỪ totalAmount → ĐÃ ĐỊNH DẠNG
    if (this.data.totalAmount != null) {
      const formatted = formatCurrency(this.data.totalAmount); // "1.500.000 ₫"
      this.form.patchValue({ amount: formatted });
    }
  }
// pay-interest-dialog.component.ts

  getSelectedMethod(value: string): PaymentMethod | undefined {
    return this.paymentMethods.find(m => m.value === value);
  }
  private parseCurrencyString(value: string): number {
    // "1.500.000 ₫" → 1500000
    return Number(value.replace(/[^\d]/g, '')); // Xóa hết ký tự không phải số
  }
  confirm(): void {
    if (this.form.invalid || this.isSubmitting) return;

    const amountStr = this.form.get('amount')?.value || '0';
    const amountNumber = this.parseCurrencyString(amountStr);

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Xác nhận đóng lãi',
        content: `Xác nhận đóng lãi kỳ <strong>${this.data.periodNumber}</strong> với số tiền <strong>${amountStr}</strong>?`,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      this.isSubmitting = true;
      const v = this.form.getRawValue();

      this.interest.payInterest(this.data.pledgeId, {
        periodNumber: this.data.periodNumber,
        payDate: this.formatDate(v.payDate),
        amount: amountNumber,
        paymentMethod: v.paymentMethod,
        id: this.data.id,
        note: v.note?.trim() || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Đóng lãi thành công!');
          this.dialogRef.close(true);
        },
        error: () => {
          this.notify.showError('Đóng lãi thất bại.');
          this.isSubmitting = false;
        },
        complete: () => this.isSubmitting = false
      });
    });
  }

  private formatDate(date: Date | string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  }

  protected readonly Math = Math;
}
