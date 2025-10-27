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
    <div class="header-icon-container">
      <mat-icon color="warn">warning_amber</mat-icon>
    </div>

    <h2 mat-dialog-title align="center">License của bạn đã hết hạn</h2>

    <mat-dialog-content align="center">
      <p class="main-message">Gói dịch vụ của cửa hàng đã không còn hoạt động.</p>
      <p>Vui lòng gia hạn để tiếp tục sử dụng hệ thống.</p>
    </mat-dialog-content>

    <mat-dialog-actions align="center" class="dialog-actions">
      <button mat-button (click)="onClose(false)">Để sau</button>

      <button mat-raised-button color="primary" (click)="onClose(true)">
        Gia hạn ngay
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Style cho Icon mới thêm vào */
    .header-icon-container {
      display: flex;
      justify-content: center;
      padding-top: 8px; /* Thêm padding, thay vì margin âm */
      margin-bottom: 8px;
    }

    .header-icon-container mat-icon {
      font-size: 64px; /* Icon to, rõ ràng */
      width: 64px;
      height: 64px;
      line-height: 64px;
      color: #f44336; /* Đảm bảo màu đỏ (warn) */
    }

    /* Style cho các phần text (Giống ảnh) */
    h2[mat-dialog-title] {
      font-weight: 600;
      font-size: 1.4rem;
      color: #333;
      padding: 0 16px;
    }

    mat-dialog-content {
      color: #555;
      line-height: 1.5;
      padding: 0 24px;
    }

    /* Style cho dòng chữ đậm (Giống ảnh) */
    .main-message {
      font-weight: 600;
      color: #222;
      font-size: 1.05rem;
      margin-bottom: 8px;
    }

    /* Style cho khu vực nút */
    .dialog-actions {
      padding: 16px 24px 24px 24px;
      gap: 12px; /* Khoảng cách giữa 2 nút */
    }

    /* Style cho nút chính (to, rõ) */
    button[mat-raised-button] {
      padding: 0 24px;
      height: 44px;
      font-weight: 600;
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
