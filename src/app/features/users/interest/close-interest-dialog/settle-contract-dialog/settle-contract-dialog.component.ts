// settle-contract-dialog.component.ts (fixed)
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InterestService, InterestSummary } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

type SettleDialogData = {
  pledgeId: number;
  pledgeCode?: string;
  summary?: InterestSummary & { remainingAmount?: number };
};

@Component({
  selector: 'app-settle-contract-dialog',
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
    // Nếu directive appCurrencyFormat là standalone, import nó vào đây.
  ],
  templateUrl: './settle-contract-dialog.component.html',
  styleUrls: ['./settle-contract-dialog.component.scss'],
})
export class SettleContractDialogComponent implements OnInit {
  form!: FormGroup;
  /** Số tiền gốc cần tất toán (không gồm phí UI) */
  baseRemaining = 0;

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<SettleContractDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: SettleDialogData
  ) {}

  ngOnInit(): void {
    const due = 0;
    // const due = this.data.summary?.totalDue ?? 0;
    const paid = this.data.summary?.totalPaid ?? 0;
    this.baseRemaining = this.data.summary?.remainingAmount ?? Math.max(due - paid, 0);

    this.form = this.fb.group({
      payerName: [''],
      amount: [this.baseRemaining, [Validators.required]],
      settleDate: [new Date(), Validators.required],
      storageFee: [0],
      otherFee: [0],
      note: [''],
    });
  }

  /** Định dạng tiền VND */
  formatMoney(amount: number | string): string {
    const n = typeof amount === 'number' ? amount : this.parseAmount(amount);
    return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
  }

  /** Parse giá trị currency từ input (20.000.000 đ -> 20000000) */
  private parseAmount(val: unknown): number {
    if (val == null) return 0;
    const s = String(val).replace(/[^\d\-]/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  /** Số tiền còn thiếu để đủ tất toán (>= 0) */
  getRemaining(): number {
    const inputAmount = this.parseAmount(this.form?.value?.amount);
    const remaining = this.baseRemaining - inputAmount;
    return remaining > 0 ? remaining : 0;
  }

  /** Tổng tiền thu tại quầy (gồm phí) */
  getTotalCollect(): number {
    const amount = this.parseAmount(this.form?.value?.amount);
    const storage = this.parseAmount(this.form?.value?.storageFee);
    const other = this.parseAmount(this.form?.value?.otherFee);
    return amount + storage + other;
  }

  /** Convert Date -> 'YYYY-MM-DD' theo yêu cầu backend */
  private toDateString(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  confirm(): void {
    if (!this.form || this.form.invalid || this.getRemaining() > 0) {
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Xác nhận tất toán hợp đồng',
        content: `Bạn chắc chắn muốn tất toán hợp đồng ${this.data.pledgeCode ?? ''}?`,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      const v = this.form.getRawValue();
      const payload = {
        amount: this.parseAmount(v.amount),
        settleDate: this.toDateString(v.settleDate),
        note: (v.note ?? '').trim(),
      };

      this.svc.settle(this.data.pledgeId, payload).subscribe({
        next: () => {
          this.notify.showSuccess('Tất toán thành công');
          this.dialogRef.close({
            ...payload,
            payerName: v.payerName ?? '',
            storageFee: this.parseAmount(v.storageFee),
            otherFee: this.parseAmount(v.otherFee),
            totalCollected: this.getTotalCollect(),
          });
        },
        error: () => this.notify.showError('Tất toán thất bại'),
      });
    });
  }
}
