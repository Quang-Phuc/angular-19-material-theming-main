import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onDismiss()">{{ data.cancelText || 'Hủy' }}</button>
      <button mat-flat-button color="warn" (click)="onConfirm()" cdkFocusInitial>{{ data.confirmText || 'Xác nhận' }}</button>
    </div>
  `,
  styles: [`
    [mat-dialog-title] { font-weight: 600; }
    [mat-dialog-actions] { padding: 0 24px 20px; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    // Trả về true khi xác nhận
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    // Trả về false khi hủy
    this.dialogRef.close(false);
  }
}
