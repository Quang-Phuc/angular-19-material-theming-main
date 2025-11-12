import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InterestService, InterestSummary } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-pay-interest-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './pay-interest-dialog.component.html',
  styleUrls: ['./pay-interest-dialog.component.scss']
})
export class PayInterestDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private interest: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<PayInterestDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { pledgeId: number; periodNumber: number }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      payDate: [new Date().toISOString().substring(0, 10), Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      note: ['']
    });
  }

  confirm(): void {
    if (this.form.invalid) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Xác nhận đóng lãi',
        content: 'Bạn có chắc chắn muốn đóng lãi cho kỳ này?',
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      const v = this.form.getRawValue();
      this.interest.payInterest(this.data.pledgeId, {
        periodNumber: this.data.periodNumber,
        payDate: v.payDate,
        amount: Number(v.amount),
        note: v.note || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Đóng lãi thành công!');
          this.dialogRef.close(true);
        },
        error: () => this.notify.showError('Đóng lãi thất bại.')
      });
    });
  }
}
