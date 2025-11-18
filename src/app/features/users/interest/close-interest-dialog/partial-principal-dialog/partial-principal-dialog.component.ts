import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table'; // THÊM DÒNG NÀY
import { InterestService } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';
import { PledgeDetailResponse } from '../../../../../core/models/pledge-detail.model'; // ĐÃ IMPORT
import { CurrencyFormatDirective } from '../../../../../core/utils/currency-format.directive';

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
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule, // THÊM DÒNG NÀY
    CurrencyFormatDirective
  ],
  templateUrl: './partial-principal-dialog.component.html',
  styleUrls: ['./partial-principal-dialog.component.scss']
})
export class PartialPrincipalDialogComponent implements OnInit {
  form!: any;
  displayedColumns = ['date', 'amount', 'rate', 'fee', 'total', 'by'];

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<PartialPrincipalDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: {
      pledgeId: number;
      contractCode?: string;
      customerName?: string;
      detail: PledgeDetailResponse; // BẮT BUỘC
    }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      payerName: [{ value: this.data.detail.customerName || '', disabled: true }],
      payDate: [new Date().toISOString().substring(0, 10), Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      newRate: [''],
      otherFee: [0],
      note: ['']
    });

    // TỰ ĐỘNG ĐIỀN
    const remaining = this.data.detail.remainingPrincipal || 0;
    if (remaining > 0) {
      setTimeout(() => this.form.patchValue({ amount: remaining }), 0);
    }

    this.form.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  // VALIDATE + TÍNH TOÁN
  getRemaining(): number {
    return this.data.detail.remainingPrincipal || 0;
  }

  getTotalPaid(): number {
    return this.parseAmount(this.form.value.amount) + this.parseAmount(this.form.value.otherFee);
  }

  getDiff(): number {
    return this.parseAmount(this.form.value.amount) - this.getRemaining();
  }

  getDiffText(): string {
    const diff = this.getDiff();
    if (diff === 0) return 'Đúng số tiền';
    if (diff > 0) return `Dư ${this.formatMoney(diff)}`;
    return `Thiếu ${this.formatMoney(Math.abs(diff))}`;
  }

  getDiffClass(): string {
    const diff = this.getDiff();
    if (diff === 0) return 'text-success';
    if (diff > 0) return 'text-warn';
    return 'text-danger';
  }

  getAmountStatus(): 'valid' | 'exceed' | 'zero' {
    const amount = this.parseAmount(this.form.value.amount);
    if (amount <= 0) return 'zero';
    if (amount > this.getRemaining()) return 'exceed';
    return 'valid';
  }

  canSubmit(): boolean {
    return this.form.valid && this.getAmountStatus() === 'valid';
  }

  private parseAmount(val: any): number {
    const str = String(val || '0').replace(/[^\d]/g, '');
    return str ? Number(str) : 0;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  confirm(): void {
    if (!this.canSubmit()) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Xác nhận trả bớt gốc',
        content: `
          <div style="text-align: left;">
            <strong>Hợp đồng:</strong> ${this.data.contractCode}<br>
            <strong>Khách hàng:</strong> ${this.data.detail.customerName}<br>
            <strong>Tiền trả bớt:</strong> ${this.formatMoney(this.parseAmount(this.form.value.amount))}<br>
            <strong>Gốc còn lại:</strong> ${this.formatMoney(this.getRemaining() - this.parseAmount(this.form.value.amount))}<br>
            <strong class="${this.getDiffClass()}">${this.getDiffText()}</strong>
          </div>
        `,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      this.svc.partialPrincipal(this.data.pledgeId, {
        amount: this.parseAmount(this.form.value.amount),
        date: this.form.value.payDate,
        note: this.form.value.note || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Trả bớt gốc thành công!');
          this.dialogRef.close(true);
        },
        error: (err) => this.notify.showError(err)
      });
    });
  }
}
