import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // <-- Thêm Router
import * as AOS from 'aos';
import { finalize } from 'rxjs/operators';

// Import các service và utils mới
import { MyErrorStateMatcher } from '../../../core/utils/error-state-matcher';
import { AuthService, RegisterPayload } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

// Import Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // <-- Thêm Spinner

@Component({
  selector: 'app-register',
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
    MatProgressSpinnerModule // <-- Thêm vào imports
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss' // <-- File này giữ nguyên
})
export class RegisterComponent implements OnInit {
  // Inject các service
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Biến trạng thái
  public isLoading = false;

  // Các biến public
  public matcher = new MyErrorStateMatcher();
  public registerForm = this.fb.group({
    storeName: [null, Validators.required],
    phone: [null, [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
    password: [null, [Validators.required, Validators.minLength(6)]]
  });

  // Getters (Giữ nguyên)
  get storeName() { return this.registerForm.get('storeName') as FormControl; }
  get phone() { return this.registerForm.get('phone') as FormControl; }
  get password() { return this.registerForm.get('password') as FormControl; }

  ngOnInit(): void {
    AOS.init({ duration: 800, once: true, offset: 0 });
  }

  /**
   * Xử lý Submit Form, Gọi API Đăng ký
   */
  /**
   * Xử lý Submit Form, Gọi API Đăng ký
   */
  onSubmit(): void {
    // Nếu form không hợp lệ, hoặc đang loading thì không làm gì cả
    if (this.registerForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.registerForm.disable(); // Khóa form lại

    const payload: RegisterPayload = this.registerForm.getRawValue();

    this.authService.register(payload).pipe(
      finalize(() => { this.isLoading = false; this.registerForm.enable(); })
    ).subscribe({
      next: (resp) => {
        // nếu success mà trả text JSON, cố parse
        let body = resp.body;
        try {
          const parsed = JSON.parse(body);
          // parsed.messages.vn ...
          this.notification.showSuccess('Đăng ký thành công!');
          this.router.navigate(['/login']);
        } catch {
          this.notification.showSuccess('Đăng ký thành công!');
        }
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
