import { Component, inject, OnInit } from '@angular/core'; // Thêm OnInit
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import * as AOS from 'aos'; // <-- Import AOS

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatIconModule
  ]
})
export class HomepageComponent implements OnInit { // <-- Implement OnInit
  private fb = inject(FormBuilder);

  signUpForm = this.fb.group({
    fullName: [null, Validators.required],
    phone: [null, Validators.required],
    email: [null, [Validators.required, Validators.email]],
    password: [null, [Validators.required, Validators.minLength(6)]]
  });

  features = [
    {
      icon: 'description',
      title: 'Quản lý Hợp đồng',
      description: 'Quản lý linh hoạt các loại hợp đồng: Cầm đồ, Tín chấp, Trả góp.'
    },
    // ... (các features khác như cũ)
    {
      icon: 'assessment',
      title: 'Báo cáo & Thống kê',
      description: 'Báo cáo doanh thu, lợi nhuận, tồn kho... theo thời gian thực.'
    },
    {
      icon: 'admin_panel_settings',
      title: 'Phân quyền Nhân viên',
      description: 'Quản lý nhân viên, phân quyền chi tiết cho từng vai trò.'
    }
  ];

  // === PHẦN "SMART" MỚI ===
  ngOnInit(): void {
    AOS.init({
      duration: 1000, // Thời gian hiệu ứng (ms)
      once: true,     // Chỉ chạy hiệu ứng 1 lần
    });
  }

  onSubmit(): void {
    if (this.signUpForm.valid) {
      console.log(this.signUpForm.value);
      alert('Đăng ký thành công!');
    } else {
      alert('Vui lòng kiểm tra lại thông tin đăng ký.');
    }
  }
}
