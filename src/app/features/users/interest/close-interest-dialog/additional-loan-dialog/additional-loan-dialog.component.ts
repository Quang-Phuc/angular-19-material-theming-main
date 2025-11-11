import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterestService, InterestSummary } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-additional-loan-dialog',
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
  templateUrl: './additional-loan-dialog.component.html',
  styleUrls: ['./additional-loan-dialog.component.scss']
})
export class AdditionalLoanDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<AdditionalLoanDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { pledgeId: number; summary?: InterestSummary }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      note: ['']
    });
  }

  confirm(): void {
    if (this.form.invalid) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận vay thêm',
        content: 'Bạn có chắc chắn muốn vay thêm cho hợp đồng này?',
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      const v = this.form.getRawValue();
      this.svc.additionalLoan(this.data.pledgeId, {
        amount: Number(v.amount),
        date: v.date,
        note: v.note || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Vay thêm thành công');
          this.dialogRef.close(true);
        },
        error: () => this.notify.showError('Vay thêm thất bại')
      });
    });
  }
}
