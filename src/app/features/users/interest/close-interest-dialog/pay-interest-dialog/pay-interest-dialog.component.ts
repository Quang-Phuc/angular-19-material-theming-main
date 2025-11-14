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

    // CHỜ FORM SẴN SÀNG RỒI MỚI GÁN
    if (this.data.totalAmount != null) {
      setTimeout(() => {
        const formatted = formatCurrency(this.data.totalAmount);
        this.form.patchValue({ amount: formatted });
      }, 0);
    }
  }
// pay-interest-dialog.component.ts

  getSelectedMethod(value: string): PaymentMethod | undefined {
    return this.paymentMethods.find(m => m.value === value);
  }
  private parseCurrencyString(value: any): number {
    // 1. Chuyển về string
    const str = String(value ?? '0').trim();

    // 2. Xóa mọi ký tự không phải số
    const clean = str.replace(/[^\d]/g, '');

    // 3. Chuyển về số, nếu rỗng → 0
    return clean ? Number(clean) : 0;
  }
  confirm(): void {
    if (this.form.invalid || this.isSubmitting) return;

    const amountStr = this.form.get('amount')?.value;
    const amountNumber = this.parseCurrencyString(amountStr);

    // Kiểm tra số tiền hợp lệ
    if (amountNumber <= 0) {
      this.notify.showError('Số tiền phải lớn hơn 0');
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Xác nhận đóng lãi',
        content: `Xác nhận đóng lãi kỳ <strong>${this.data.periodNumber}</strong> với số tiền <strong>${this.formatMoney(amountNumber)}</strong>?`,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      this.isSubmitting = true;

      this.interest.payInterest(this.data.pledgeId, {
        periodNumber: this.data.periodNumber,
        payDate: this.formatDate(this.form.value.payDate),
        amount: amountNumber,
        paymentMethod: this.form.value.paymentMethod,
        id: this.data.id,
        note: this.form.value.note?.trim() || ''
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
