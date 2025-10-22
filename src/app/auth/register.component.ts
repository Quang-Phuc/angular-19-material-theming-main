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
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);

  // Form đơn giản: Chỉ 3 trường
  registerForm = this.fb.group({
    storeName: [null, Validators.required],
    phone: [null, [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
    password: [null, [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Đăng ký với:', this.registerForm.value);
      alert('Đăng ký dùng thử thành công!');
      // TODO: Điều hướng đến trang dashboard
    }
  }
}
