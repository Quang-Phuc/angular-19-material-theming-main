// src/app/core/services/notification.service.ts

import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  /**
   * Hàm helper: Cấu hình chung cho snackbar
   */
  private getConfig(panelClass: string, duration = 5000): MatSnackBarConfig {
    return {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass],
    };
  }

  /**
   * Hiển thị thông báo thành công (màu xanh)
   */
  showSuccess(message: string): void {
    const config = this.getConfig('snackbar-success', 3000);
    this.snackBar.open(message, 'Đóng', config);
  }

  /**
   * Hiển thị thông báo lỗi (màu đỏ)
   */
  showError(error: any): void {
    let errorMessage = 'Đã có lỗi xảy ra';
    const config = this.getConfig('snackbar-error', 7000);

    if (!error) {
      this.snackBar.open(errorMessage, 'Đóng', config);
      return;
    }

    if (typeof error === 'string') {
      this.snackBar.open(error, 'Đóng', config);
      return;
    }

    const raw = error?.error ?? error?.message ?? error;

    try {
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        errorMessage =
          parsed?.messages?.vn ||
          parsed?.message ||
          parsed?.messages?.en ||
          raw;
      } else if (typeof raw === 'object') {
        errorMessage =
          raw?.messages?.vn ||
          raw?.message ||
          raw?.messages?.en ||
          JSON.stringify(raw);
      } else {
        errorMessage = String(raw);
      }
    } catch {
      errorMessage =
        error?.error?.messages?.vn ||
        error?.error?.message ||
        error?.message ||
        'Đã có lỗi xảy ra';
    }

    this.snackBar.open(errorMessage, 'Đóng', config);
  }

  /**
   * Hiển thị thông báo thông tin (màu xanh dương)
   */
  showInfo(message: string): void {
    const config = this.getConfig('snackbar-info', 3000);
    this.snackBar.open(message, 'Đóng', config);
  }

  /**
   * Hiển thị thông báo cảnh báo (màu cam/vàng)
   */
  showWarning(message: string): void {
    const config = this.getConfig('snackbar-warning', 5000);
    this.snackBar.open(message, 'Đóng', config);
  }

  /**
   * Hiển thị thông báo xác nhận (có nút Có/Không)
   * Trả về Promise<boolean>: true = nhấn "Có", false = nhấn "Không" hoặc hết thời gian
   */
  showConfirm(
    message: string,
    confirmText = 'Có',
    cancelText = 'Không',
    duration = 10000
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const config: MatSnackBarConfig = {
        duration,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['snackbar-confirm'],
      };

      const snackBarRef: MatSnackBarRef<TextOnlySnackBar> = this.snackBar.open(
        message,
        confirmText,
        config
      );

      // Nhấn nút "Có"
      snackBarRef.onAction().subscribe(() => {
        resolve(true);
        snackBarRef.dismiss();
      });

      // Hết thời gian hoặc nhấn "Đóng" hoặc "Không"
      snackBarRef.afterDismissed().subscribe(() => {
        resolve(false);
      });

      // Tự động thêm nút "Không" (vì MatSnackBar không hỗ trợ 2 action buttons)
      setTimeout(() => {
        const container = document.querySelector('.snackbar-confirm .mat-mdc-snack-bar-container');
        if (container && !container.querySelector('.snack-cancel-btn')) {
          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = cancelText;
          cancelBtn.className = 'snack-cancel-btn';
          cancelBtn.style.cssText = `
            background: transparent;
            border: none;
            color: #d32f2f;
            font-weight: 500;
            cursor: pointer;
            margin-left: 12px;
            font-size: 0.875rem;
          `;
          cancelBtn.onclick = (e) => {
            e.stopPropagation();
            resolve(false);
            snackBarRef.dismiss();
          };
          container.appendChild(cancelBtn);
        }
      }, 0);
    });
  }
}
