// login.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import * as AOS from 'aos';

// Core services and utils
import { AuthService, LoginPayload } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MyErrorStateMatcher } from '../../../core/utils/error-state-matcher';

// === THÊM MODULES MỚI ===
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// === IMPORT DIALOG MỚI ===
// (Điều chỉnh đường dẫn này cho đúng với cấu trúc dự án của bạn)
import { LicenseExpiredDialogComponent } from '../../../core/dialogs/license-expired-dialog/license-expired-dialog.component';

// Import Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule // <-- THÊM MatDialogModule VÀO IMPORTS
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog); // <-- INJECT MatDialog

  isLoading = false;
  matcher = new MyErrorStateMatcher();

  loginForm = this.fb.group({
    phone: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    AOS.init({ duration: 800, once: true, offset: 0 });
  }

  get phone() { return this.loginForm.get('phone') as FormControl; }
  get password() { return this.loginForm.get('password') as FormControl; }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.loginForm.disable();

    const payload: LoginPayload = {
      phone: this.phone.value,
      password: this.password.value,
      type: 'USER'
    };

    this.authService.login(payload).pipe(
      finalize(() => {
        this.isLoading = false;
        this.loginForm.enable();
      })
    ).subscribe({
      next: (user) => {
        this.notification.showSuccess('Đăng nhập thành công!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // === LOGIC XỬ LÝ LỖI ĐÃ CẬP NHẬT ===

        let errorMessage = 'Lỗi không xác định';
        let errorCode = null; // Biến để lưu mã lỗi
        let raw = err?.error ?? err?.message ?? 'Đã có lỗi';

        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            errorMessage = parsed.messages?.vn || parsed.message || JSON.stringify(parsed);
            errorCode = parsed.code || null; // Lấy mã lỗi
          } catch {
            errorMessage = raw;
          }
        } else if (typeof raw === 'object') {
          errorMessage = raw.messages?.vn || raw.message || JSON.stringify(raw);
          errorCode = raw.code || null; // Lấy mã lỗi
        }

        // Kiểm tra mã lỗi
        if (errorCode === 'SS004') {
          // Nếu là lỗi hết hạn, mở dialog
          this.openLicenseDialog();
        } else {
          // Nếu là lỗi khác, hiển thị toast như cũ
          this.notification.showError(errorMessage);
        }
      }
    });
  }

  /**
   * Hàm mới để mở dialog hết hạn license
   */
  private openLicenseDialog(): void {
    const dialogRef = this.dialog.open(LicenseExpiredDialogComponent, {
      width: '450px',
      disableClose: true, // Không cho đóng khi click bên ngoài
    });

    // Lắng nghe kết quả khi dialog đóng
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Người dùng đã click "Mua License"
        // Bạn cần tạo trang và route cho '/purchase-license'
        this.router.navigate(['/purchase-license']);
      } else {
        // Người dùng đã click "Hủy"
        // Không làm gì cả, họ sẽ ở lại trang login
      }
    });
  }
}
