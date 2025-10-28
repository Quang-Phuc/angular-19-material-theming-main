import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="warn">warning</mat-icon>
      <span>{{ data.title }}</span>
    </h2>
    <mat-dialog-content>
      <p [innerHTML]="data.message"></p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText || 'Hủy bỏ' }}</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true" cdkFocusInitial>
        {{ data.confirmText || 'Đồng ý' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class StoreConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<StoreConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
