import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router'; // Import RouterLink

// Import Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink, // Thêm RouterLink
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  loginForm = this.fb.group({
    phone: [null, [Validators.required]],
    password: [null, [Validators.required]]
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Đăng nhập với:', this.loginForm.value);
      alert('Đăng nhập thành công!');
      // TODO: Điều hướng đến trang dashboard
    }
  }
}
