import {inject, Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  // Cấu hình chung cho vị trí
  private commonConfig: MatSnackBarConfig = {
    horizontalPosition: 'right', verticalPosition: 'top',
  };

  /**
   * Hiển thị thông báo thành công (màu xanh)
   */
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      ...this.commonConfig, // Áp dụng cấu hình vị trí
      duration: 3000, panelClass: ['snackbar-success'] // (Bạn cần định nghĩa class này trong styles.scss)
    });
  }

  /**
   * Hiển thị thông báo lỗi (màu đỏ)
   */
  showError(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      ...this.commonConfig, // Áp dụng cấu hình vị trí
      duration: 5000, panelClass: ['snackbar-error'] // (Bạn cần định nghĩa class này trong styles.scss)
    });
  }

  /**
   * NEW: Shows an informational notification (blue)
   */
  showInfo(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      ...this.commonConfig, // Apply position config
      duration: 3000,       // Duration like success
      panelClass: ['snackbar-info'] // Needs CSS definition
    });
  }
}
