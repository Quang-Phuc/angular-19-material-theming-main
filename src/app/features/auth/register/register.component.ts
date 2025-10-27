// src/app/features/auth/register/register.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import * as AOS from 'aos';
// *** 1. Import HttpErrorResponse ***
import { HttpErrorResponse } from '@angular/common/http';

// Core services and utils (using corrected paths)
import { AuthService, RegisterPayload } from '../../../core/services/auth.service'; // Ensure correct path
import { NotificationService } from '../../../core/services/notification.service'; // Ensure correct path
import { MyErrorStateMatcher } from '../../../core/utils/error-state-matcher'; // Ensure correct path

// Import Material Modules used in the template
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  isLoading = false;
  matcher = new MyErrorStateMatcher();

  registerForm = this.fb.group({
    storeName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    AOS.init({ duration: 800, once: true, offset: 0 });
  }

  get storeName() { return this.registerForm.get('storeName') as FormControl; }
  get phone() { return this.registerForm.get('phone') as FormControl; }
  get password() { return this.registerForm.get('password') as FormControl; }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.registerForm.disable();

    const payload: RegisterPayload = this.registerForm.getRawValue();

    this.authService.register(payload).pipe(
      finalize(() => {
        this.isLoading = false;
        this.registerForm.enable();
      })
    ).subscribe({
      next: (response) => {
        this.notification.showSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
        this.router.navigate(['/login']);
      },
      // *** 2. Add the type here ***
      error: (err) => {
        // (Logic xử lý lỗi SS004 của bạn giữ nguyên)
        let errorMessage = 'Lỗi không xác định';
        let errorCode = null;
        let raw = err?.error ?? err?.message ?? 'Đã có lỗi';

        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            errorMessage = parsed.messages?.vn || parsed.message || JSON.stringify(parsed);
            errorCode = parsed.code || null;
          } catch {
            errorMessage = raw;
          }
        } else if (typeof raw === 'object') {
          errorMessage = raw.messages?.vn || raw.message || JSON.stringify(raw);
          errorCode = raw.code || null;
        }

          this.notification.showError(errorMessage);
      }
    });
  }
}
