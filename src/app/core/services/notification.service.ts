import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  /**
   * Hàm helper Cấu hình chung
   * Lấy cấu hình chung và gán panelClass
   */
  private getConfig(panelClass: string, duration = 5000): MatSnackBarConfig {
    return {
      duration: duration,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass], // Key để custom màu trong styles.scss
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
   * (Sử dụng logic phân tích lỗi của bạn)
   */
  showError(error: any): void {
    let errorMessage = 'Đã có lỗi xảy ra';
    const config = this.getConfig('snackbar-error', 7000); // Lỗi hiển thị lâu hơn

    if (!error) {
      this.snackBar.open(errorMessage, 'Đóng', config);
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
    const config = this.getConfig('snackbar-warning', 5000); //
    this.snackBar.open(message, 'Đóng', config);
  }
}
