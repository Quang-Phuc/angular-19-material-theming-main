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
  showError(error: any): void {
    let errorMessage = 'Đã có lỗi xảy ra';

    if (!error) {
      this.snackBar.open(errorMessage, 'Đóng', {
        ...this.commonConfig,
        duration: 5000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // ✅ Lấy phần error gốc bên trong HttpErrorResponse
    const raw = error?.error ?? error?.message ?? error;

    try {
      if (typeof raw === 'string') {
        // Nếu là chuỗi, thử parse JSON
        const parsed = JSON.parse(raw);
        errorMessage =
          parsed?.messages?.vn ||
          parsed?.message ||
          parsed?.messages?.en ||
          raw;
      } else if (typeof raw === 'object') {
        // Nếu là object JSON
        errorMessage =
          raw?.messages?.vn ||
          raw?.message ||
          raw?.messages?.en ||
          JSON.stringify(raw);
      } else {
        errorMessage = String(raw);
      }
    } catch {
      // Nếu không parse được
      errorMessage =
        error?.error?.messages?.vn ||
        error?.error?.message ||
        error?.message ||
        'Đã có lỗi xảy ra';
    }

    this.snackBar.open(errorMessage, 'Đóng', {
      ...this.commonConfig,
      duration: 5000,
      panelClass: ['snackbar-error'],
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
