// src/app/features/interest/close-interest-dialog/extend-term-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InterestService } from '../../../../core/services/interest.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-extend-term-dialog',
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
    <h2 mat-dialog-title>Gia hạn kỳ</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Kỳ cần gia hạn</mat-label>
          <input matInput type="number" formControlName="termNumber" placeholder="VD: 1">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Số ngày gia hạn</mat-label>
          <input matInput type="number" formControlName="extendDays" placeholder="VD: 5">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Lý do</mat-label>
          <textarea matInput formControlName="reason"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Hủy</button>
      <button mat-flat-button color="primary" (click)="confirm()" [disabled]="form.invalid">Xác nhận</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form .full { width: 100%; }
  `]
})
export class ExtendTermDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private svc: InterestService,
    private notify: NotificationService,
    private dialogRef: MatDialogRef<ExtendTermDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: { pledgeId: number }
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      termNumber: [1, [Validators.required, Validators.min(1)]],
      extendDays: [1, [Validators.required, Validators.min(1)]],
      reason: ['']
    });
  }

  confirm(): void {
    if (this.form.invalid) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận gia hạn kỳ',
        content: 'Bạn có chắc chắn muốn gia hạn kỳ này?',
        confirmText: 'Đồng ý',
        cancelText: 'Hủy'
      }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;

      const v = this.form.getRawValue();
      this.svc.extendTerm(this.data.pledgeId, {
        termNumber: Number(v.termNumber),
        extendDays: Number(v.extendDays),
        reason: v.reason || ''
      }).subscribe({
        next: () => {
          this.notify.showSuccess('Gia hạn thành công');
          this.dialogRef.close(true);
        },
        error: () => this.notify.showError('Gia hạn thất bại')
      });
    });
  }
}
