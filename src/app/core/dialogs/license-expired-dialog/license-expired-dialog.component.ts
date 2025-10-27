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

      <button mat-raised-button (click)="onClose(true)">
        Gia hạn ngay
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* ----- PHẦN STYLE CŨ (GIỮ NGUYÊN) ----- */
    .header-icon-container {
      display: flex;
      justify-content: center;
      padding-top: 8px;
      margin-bottom: 8px;
    }

    .header-icon-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      line-height: 64px;
      color: #f44336; /* Màu đỏ cảnh báo */
    }

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

    .main-message {
      font-weight: 600;
      color: #222;
      font-size: 1.05rem;
      margin-bottom: 8px;
    }

    /* ----- PHẦN STYLE MỚI CHO BUTTON (CẬP NHẬT) ----- */

    .dialog-actions {
      padding: 16px 24px 24px 24px;
      gap: 12px;
      display: flex;
      justify-content: center;
    }

    /* 1. Style cho nút phụ "Để sau" (Làm mờ đi) */
    .dialog-actions button[mat-button] {
      font-weight: 600;
      color: #888; /* Màu xám, ít chú ý */
      background-color: transparent;
      box-shadow: none;
      transition: background-color 0.2s ease;
      border-radius: 50px; /* Bo tròn đồng bộ */
      height: 44px;
      padding: 0 24px;
    }

    .dialog-actions button[mat-button]:hover {
      background-color: #f1f1f1; /* Hiệu ứng hover nhẹ */
    }

    /* 2. Style cho nút chính "Gia hạn ngay" (NỔI BẬT) */
    .dialog-actions button[mat-raised-button] {
      /* Gradient (Xanh Dương/Ngọc) */
      background: linear-gradient(135deg, #0072ff 0%, #00d4ff 100%);
      color: white;
      border: none;

      /* Kích thước & Hình dáng */
      height: 44px;
      padding: 0 24px;
      font-weight: 600;
      border-radius: 50px; /* Bo tròn mịn */

      /* Bóng (Shadow) */
      box-shadow: 0 4px 15px 0 rgba(0, 162, 255, 0.35);

      /* Hiệu ứng chuyển động */
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    /* 3. Hiệu ứng HOVER cho nút chính */
    .dialog-actions button[mat-raised-button]:hover {
      transform: translateY(-3px); /* Nâng button lên */
      box-shadow: 0 6px 20px 0 rgba(0, 162, 255, 0.5); /* Bóng to hơn */
    }

    /* 4. Hiệu ứng NHẤN (Active) cho nút chính */
    .dialog-actions button[mat-raised-button]:active {
      transform: translateY(1px); /* Nhấn button xuống */
      box-shadow: 0 2px 10px 0 rgba(0, 162, 255, 0.3);
    }
  `]
})
export class LicenseExpiredDialogComponent {
  private dialogRef = inject(MatDialogRef<LicenseExpiredDialogComponent>);

  onClose(shouldPurchase: boolean): void {
    this.dialogRef.close(shouldPurchase);
  }
}
