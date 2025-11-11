// src/app/features/interest/close-interest-dialog/partial-principal-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InterestService, InterestSummary } from '../../../../core/services/interest.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-partial-principal-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Trả bớt gốc</h2>

    <mat-dialog-content>
      <div class="summary" *ngIf="data.summary">
        <div>Gốc còn lại: <b>{{ data.summary.remainingPrincipal | number:'1.0-0' }} đ</b></div>
      </div>

      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Số tiền trả bớt</mat-label>
          <input matInput type="number" formControlName="amount" placeholder="Nhập số tiền">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Ngày trả</mat-label>
          <input matInput type="date" formControlName="date">
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
    .summary { margin-bottom: 8px; }
    .form .full { width: 100%; }
  `]
})
export class PartialPrincipalDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<PartialPrincipalDialogComponent>,
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
        title: 'Xác nhận trả bớt gốc',
        content: 'Bạn có chắc chắn muốn trả bớt gốc?',
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
