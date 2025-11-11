import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InterestService } from '../../../../../core/services/interest.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../core/dialogs/confirm-dialog/confirm-dialog.component';

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
    MatIconModule
  ],
  templateUrl: './extend-term-dialog.component.html',
  styleUrls: ['./extend-term-dialog.component.scss']
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
          this.notify.showSuccess('Gia hạn kỳ thành công');
          this.dialogRef.close(true);
        },
        error: () => this.notify.showError('Gia hạn kỳ thất bại')
      });
    });
  }
}
