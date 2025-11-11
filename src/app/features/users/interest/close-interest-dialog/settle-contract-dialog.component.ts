// src/app/features/interest/close-interest-dialog/settle-contract-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterestService, InterestSummary } from '../../../../core/services/interest.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-settle-contract-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Tất toán hợp đồng</h2>
    <mat-dialog-content>
      <div class="summary" *ngIf="data.summary">
        <div>Gốc còn lại: <b>{{ data.summary.remainingPrincipal | number:'1.0-0' }} đ</b></div>
        <div>Lãi đến hôm nay: <b>{{ data.summary.interestToday | number:'1.0-0' }} đ</b></div>
      </div>

      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Số tiền tất toán</mat-label>
          <input matInput type="number" formControlName="amount" placeholder="Nhập số tiền">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Ngày tất toán</mat-label>
          <input matInput type="date" formControlName="settleDate">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Ghi chú</mat-label>
          <textarea matInput formControlName="note"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="form.invalid">Xác nhận</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .summary { margin-bottom: 8px; display: grid; gap: 4px; }
    .form .full { width: 100%; }
  `],
  providers: [DatePipe]
})
export class SettleContractDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<SettleContractDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { pledgeId: number; summary?: InterestSummary }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      settleDate: [new Date().toISOString().substring(0, 10), Validators.required],
      note: ['']
    });
  }

  confirm(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.svc.settle(this.data.pledgeId, {
      amount: Number(v.amount),
      settleDate: v.settleDate,
      note: v.note || ''
    }).subscribe({
      next: () => {
        this.notify.showSuccess('Tất toán thành công!');
        this.dialogRef.close(true);
      },
      error: () => this.notify.showError('Tất toán thất bại!')
    });
  }
}
