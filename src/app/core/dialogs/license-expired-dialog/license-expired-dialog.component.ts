// license-expired-dialog.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-license-expired-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="warn">warning</mat-icon>
      Thông báo hết hạn License
    </h2>
    <mat-dialog-content>
      <p>Gói license của cửa hàng đã hết hạn.</p>
      <p>Bạn có muốn gia hạn để tiếp tục sử dụng không?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose(false)">Hủy</button>

      <button mat-flat-button color="primary" (click)="onClose(true)">
        Mua License
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    mat-dialog-content p {
      margin-bottom: 12px;
    }
  `]
})
export class LicenseExpiredDialogComponent {
  private dialogRef = inject(MatDialogRef<LicenseExpiredDialogComponent>);

  /**
   * Đóng dialog và trả về kết quả
   * @param shouldPurchase true nếu click "Mua", false nếu click "Hủy"
   */
  onClose(shouldPurchase: boolean): void {
    this.dialogRef.close(shouldPurchase);
  }
}
