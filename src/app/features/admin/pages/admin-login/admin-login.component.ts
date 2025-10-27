import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router'; // Import Router
import { finalize } from 'rxjs/operators';
import * as AOS from 'aos';

// Core services and utils
import { AuthService, LoginPayload } from '../../../../core/services/auth.service'; // Assuming login uses same payload for now
import { NotificationService } from '../../../../core/services/notification.service';
import { MyErrorStateMatcher } from '../../../../core/utils/error-state-matcher';

// Import Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-login', // Changed selector
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // RouterLink is not needed if no links in template
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule, // Make sure this is imported
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-login.component.html', // Changed template URL
  styleUrl: './admin-login.component.scss' // Changed style URL
})
export class AdminLoginComponent implements OnInit { // Added OnInit
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  isLoading = false;
  matcher = new MyErrorStateMatcher();

  // Using email for admin login might be more appropriate
  loginForm = this.fb.group({
    // Changed 'phone' to 'email' and added email validator
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Initialize AOS for potential entry animations
    AOS.init({ duration: 800, once: true, offset: 0 });
  }

  // Getters for easier template access
  get email() { return this.loginForm.get('email') as FormControl; }
  get password() { return this.loginForm.get('password') as FormControl; }

  onSubmit(): void {
    this.loginForm.markAllAsTouched(); // Trigger validation on submit attempt

    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.loginForm.disable(); // Disable form during API call

    // Adapt payload if necessary (e.g., use email)
    const payload: LoginPayload = {
      phone: this.email.value, // Map email to phone field if API expects phone
      // OR if API expects email:
      // email: this.email.value,
      password: this.password.value,
      type: 'ADMIN'
    };

    // Assuming AuthService has a login method that handles API call and token storage
    // You might need a specific adminLogin method if the endpoint or logic differs
    this.authService.login(payload).pipe(
      finalize(() => {
        this.isLoading = false;
        this.loginForm.enable(); // Re-enable form
      })
    ).subscribe({
      next: (user) => {
        this.notification.showSuccess('Đăng nhập Admin thành công!');
        // Redirect to the main admin dashboard after successful login
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error: Error) => {
        this.notification.showError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    });
  }
}
