// login.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Import Router và RouterLink
import { finalize } from 'rxjs/operators';
import * as AOS from 'aos';

// Core services and utils (Giả định đường dẫn tương tự như admin)
import { AuthService, LoginPayload } from '../../../core/services/auth.service'; // Assuming login uses same payload for now
import { NotificationService } from '../../../core/services/notification.service';
import { MyErrorStateMatcher } from '../../../core/utils/error-state-matcher';

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
    RouterLink, // Giữ lại RouterLink cho link "Đăng ký" và "Quên mật khẩu"
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule, // Thêm module này
    MatProgressSpinnerModule // Thêm module này
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit { // Thêm OnInit
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  isLoading = false;
  matcher = new MyErrorStateMatcher();

  // Form group vẫn giữ nguyên
  loginForm = this.fb.group({
    phone: ['', [Validators.required]], // Đổi `null` thành `''` để nhất quán
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Initialize AOS cho animation
    AOS.init({ duration: 800, once: true, offset: 0 });
  }

  // Getters để truy cập form control trong template dễ dàng
  get phone() { return this.loginForm.get('phone') as FormControl; }
  get password() { return this.loginForm.get('password') as FormControl; }

  onSubmit(): void {
    this.loginForm.markAllAsTouched(); // Hiển thị lỗi validation nếu có

    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.loginForm.disable(); // Vô hiệu hóa form khi đang gọi API

    // Tạo payload
    const payload: LoginPayload = {
      phone: this.phone.value, // Dữ liệu từ form
      password: this.password.value,
      type: 'USER' // Giả định 'USER' là type cho đăng nhập thông thường
    };

    // Gọi login service
    this.authService.login(payload).pipe(
      finalize(() => {
        // Chạy khi observable hoàn thành (thành công hoặc lỗi)
        this.isLoading = false;
        this.loginForm.enable(); // Kích hoạt lại form
      })
    ).subscribe({
      next: (user) => {
        this.notification.showSuccess('Đăng nhập thành công!');
        // Điều hướng đến trang dashboard chính của người dùng
        this.router.navigate(['/dashboard']); // Hoặc route chính của bạn
      },
      error: (err) => {

        let errorMessage = 'Lỗi không xác định';
        let raw = err?.error ?? err?.message ?? 'Đã có lỗi';

        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            errorMessage = parsed.messages?.vn || parsed.message || JSON.stringify(parsed);
          } catch {
            errorMessage = raw;
          }
        } else if (typeof raw === 'object') {
          errorMessage = raw.messages?.vn || raw.message || JSON.stringify(raw);
        }

        this.notification.showError(errorMessage);
      }
    });
  }
}
