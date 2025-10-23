import { Component, inject, OnInit } from '@angular/core'; // <-- Thêm OnInit
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as AOS from 'aos'; // <-- Import AOS

// Import Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

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
    MatFormFieldModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit { // <-- Implement OnInit
  private fb = inject(FormBuilder);

  // Form đơn giản: Chỉ 3 trường
  registerForm = this.fb.group({
    storeName: [null, Validators.required],
    phone: [null, [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
    password: [null, [Validators.required, Validators.minLength(6)]]
  });

  // *** THÊM PHẦN NÀY ĐỂ KÍCH HOẠT HIỆU ỨNG ***
  ngOnInit(): void {
    AOS.init({
      duration: 800, // Thời gian hiệu ứng nhanh hơn
      once: true,    // Chỉ chạy 1 lần
      offset: 0,     // Kích hoạt ngay
    });
  }
  // *******************************************

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log('Đăng ký với:', this.registerForm.value);
      alert('Đăng ký dùng thử thành công!');
      // TODO: Điều hướng đến trang dashboard
    }
  }
}
