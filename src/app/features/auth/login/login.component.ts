// login.component.ts (With Debug Logs)

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import * as AOS from 'aos';

// Import services and interfaces
import { AuthService, LoginPayload, AuthResponse } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MyErrorStateMatcher } from '../../../core/utils/error-state-matcher';

// Import dialog components and modules
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
    CommonModule, ReactiveFormsModule, RouterLink, MatCardModule,
    MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatDialogModule
  ],
  templateUrl: './login.component.html', // cite: 1
  styleUrl: './login.component.scss' // cite: 2
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

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
      type: 'USER' // Assume USER for store owner/employee
    };

    this.authService.login(payload).pipe(
      finalize(() => {
        this.isLoading = false;
        this.loginForm.enable();
      })
    ).subscribe({
      next: (response: AuthResponse) => {
        // Save auth data to localStorage
        this.authService.saveAuthData(response);

        this.notification.showSuccess('Đăng nhập thành công!');

        // --- DEBUG LOGS ADDED HERE ---
        console.log('Attempting navigation to /store...');
        // Verify roles are saved BEFORE navigating
        console.log('Current roles in localStorage:', localStorage.getItem('userRoles'));
        // --- END DEBUG LOGS ---

        // Navigate to the store management page
        this.router.navigate(['/store']); // cite: 0
      },
      error: (err) => {
        // Handle login errors (including SS004)
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

        if (errorCode === 'SS004') {
          this.openLicenseDialog();
        } else {
          this.notification.showError(errorMessage);
        }
      }
    });
  }

  private openLicenseDialog(): void {
    // Open license expired dialog
    const dialogRef = this.dialog.open(LicenseExpiredDialogComponent, {});
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.router.navigate(['/purchase-license']);
      }
    });
  }
}
