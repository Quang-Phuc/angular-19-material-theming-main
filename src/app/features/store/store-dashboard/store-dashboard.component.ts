// store-dashboard.component.ts (File mới)

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import các module Material CHỈ DÙNG cho trang này
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-store-dashboard', // <-- Sửa selector
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './store-dashboard.component.html', // <-- Sửa templateUrl
  styleUrl: './store-dashboard.component.scss' // <-- Sửa styleUrl
})
export class StoreDashboardComponent {

  // TODO: Thay thế dữ liệu mock này bằng API thật của tiệm
  kpiCards = [
    {
      title: 'Hợp đồng mới (Tháng)',
      value: '25',
      percent: 8.2,
      isPositive: true,
      icon: 'description',
      color: 'primary'
    },
    {
      title: 'Khách hàng mới',
      value: '+12',
      percent: 5,
      isPositive: true,
      icon: 'person_add',
      color: 'accent'
    },
    {
      title: 'Tiền giải ngân (Hôm nay)',
      value: '50.000.000đ',
      percent: 15,
      isPositive: true,
      icon: 'payments',
      color: 'info'
    },
    {
      title: 'Hợp đồng sắp hết hạn',
      value: '8',
      percent: 0,
      isPositive: false,
      icon: 'event_busy',
      color: 'warn'
    }
  ];

  recentActivities = [
    { user: 'Nhân viên: Thu Ngân', action: 'vừa tạo hợp đồng [HD-00123].', time: '5 phút trước' },
    { user: 'Khách hàng: Nguyễn Văn A', action: 'vừa thanh toán lãi HĐ [HD-00100].', time: '1 giờ trước' },
    { user: 'Hệ thống', action: 'Hợp đồng [HD-00095] đã quá hạn.', time: '2 giờ trước' },
  ];
}
