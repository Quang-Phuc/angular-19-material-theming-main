import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {InterestService, InterestSummary} from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-partial-principal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './partial-principal-dialog.component.html',
  styleUrls: ['./partial-principal-dialog.component.scss']
})
export class PartialPrincipalDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<PartialPrincipalDialogComponent>,
    private dialog: MatDialog,
    // ĐÃ SỬA – BẮT BUỘC CÓ SUMMARY + THÊM CÁC TRƯỜNG TIỆN DỤNG
    @Inject(MAT_DIALOG_DATA) public data: {
      pledgeId: number;
      contractCode?: string;        // Dùng để hiển thị tiêu đề luôn
      customerName?: string;        // Hiển thị tên khách ngay
      summary: InterestSummary;     // BẮT BUỘC có (không còn optional)
    }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      payerName: [{ value: this.data.customerName || '', disabled: true }],
      payDate: [new Date().toISOString().substring(0, 10), Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      newRate: [''],
      otherFee: [0],
      note: ['']
    });

    // Tự động focus + validate realtime
    this.form.get('amount')?.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  getAmountStatus(): 'valid' | 'exceed' | 'zero' {
    const amount = this.parseAmount(this.form.value.amount);
    const remaining = this.data.summary?.remainingPrincipal || 0;
    if (amount <= 0) return 'zero';
    if (amount > remaining) return 'exceed';
    return 'valid';
  }

  getAmountStatusText(): string {
    const status = this.getAmountStatus();
    const amount = this.parseAmount(this.form.value.amount);
    const remaining = this.data.summary?.remainingPrincipal || 0;

    if (status === 'exceed') return `Vượt quá gốc còn lại ${this.formatMoney(remaining - amount)}`;
    if (status === 'zero') return 'Số tiền phải lớn hơn 0';
    return `Còn lại sau trả: ${this.formatMoney(remaining - amount)}`;
  }

  getAmountStatusClass(): string {
    const status = this.getAmountStatus();
    return status === 'valid' ? 'text-success' : 'text-danger';
  }

  getTotalPaid(): number {
    return this.parseAmount(this.form.value.amount) + this.parseAmount(this.form.value.otherFee);
  }

  private parseAmount(val: any): number {
    return Number(String(val || '0').replace(/[^\d]/g, '')) || 0;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  confirm(): void {
    if (this.form.invalid) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận trả bớt gốc',
        content: 'Bạn có chắc chắn muốn trả bớt gốc cho hợp đồng này?',
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      const v = this.form.getRawValue();
      this.svc.partialPrincipal(this.data.pledgeId, {
        amount: Number(v.amount),
        date: v.date,
        note: v.note || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Trả bớt gốc thành công');
          this.dialogRef.close(true);
        },
        error: () => this.notify.showError('Trả bớt gốc thất bại')
      });
    });
  }
}
