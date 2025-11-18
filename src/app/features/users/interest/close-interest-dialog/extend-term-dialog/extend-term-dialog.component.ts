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
import { MatTableModule } from '@angular/material/table';
import { InterestService } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';
import { PledgeDetailResponse } from '../../../../../core/models/pledge-detail.model';

@Component({
  selector: 'app-extend-term-dialog',
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
    MatTableModule
  ],
  templateUrl: './extend-term-dialog.component.html',
  styleUrls: ['./extend-term-dialog.component.scss']
})
export class ExtendTermDialogComponent implements OnInit {
  form!: any;
  displayedColumns = ['date', 'days', 'old', 'new', 'by'];

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<ExtendTermDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: {
      pledgeId: number;
      contractCode?: string;
      customerName?: string;
      detail: PledgeDetailResponse;
    }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      termNumber: [1, [Validators.required, Validators.min(1)]],
      extendDays: [0],
      reason: ['']
    });

    this.form.valueChanges.subscribe(() => this.cdr.detectChanges());
  }

  getExtendedDays(): number {
    const term = this.form.value.termNumber || 0;
    const days = this.form.value.extendDays || 0;
    return days > 0 ? days : term * 30;
  }

  getNewDueDate(): Date {
    const currentDue = new Date(this.data.detail.dueDate);
    currentDue.setDate(currentDue.getDate() + this.getExtendedDays());
    return currentDue;
  }

  canSubmit(): boolean {
    return this.form.valid && this.getExtendedDays() > 0;
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  }

  confirm(): void {
    if (!this.canSubmit()) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Xác nhận gia hạn kỳ',
        content: `
          <div style="text-align: left;">
            <strong>Hợp đồng:</strong> ${this.data.contractCode}<br>
            <strong>Khách hàng:</strong> ${this.data.detail.customerName}<br>
            <strong>Hạn hiện tại:</strong> ${this.formatDate(this.data.detail.dueDate)}<br>
            <strong>Hạn mới:</strong> <span class="text-success">${this.formatDate(this.getNewDueDate())}</span><br>
            <strong>Gia hạn:</strong> +${this.getExtendedDays()} ngày<br>
            <strong>Lý do:</strong> ${this.form.value.reason || 'Không có'}
            ${this.data.detail.extensionFee > 0 ? '<br><strong>Phí gia hạn:</strong> ' + this.formatMoney(this.data.detail.extensionFee) : ''}
          </div>
        `,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      this.svc.extendTerm(this.data.pledgeId, {
        termNumber: this.form.value.termNumber,        // ← GỬI KỲ
        extendDays: this.getExtendedDays(),           // ← SỐ NGÀY TÍNH TOÁN
        reason: this.form.value.reason || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Gia hạn kỳ thành công!');
          this.dialogRef.close(true);
        },
        error: (err) => this.notify.showError(err)
      });
    });
  }
}
