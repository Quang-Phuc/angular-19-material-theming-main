import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  /**
   * Hiển thị thông báo thành công (màu xanh)
   */
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 3000,
      panelClass: ['snackbar-success'] // (Bạn cần định nghĩa class này trong styles.scss)
    });
  }

  /**
   * Hiển thị thông báo lỗi (màu đỏ)
   */
  showError(message: string): void {
    this.snackBar.open(message, 'Đóng', {
      duration: 5000,
      panelClass: ['snackbar-error'] // (Bạn cần định nghĩa class này trong styles.scss)
    });
  }
}
