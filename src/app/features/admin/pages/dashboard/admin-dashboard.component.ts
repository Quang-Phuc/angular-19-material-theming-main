import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import các module Material CHỈ DÙNG cho trang này
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatCardModule
    // Xóa MatSidenavModule, MatToolbarModule, MatExpansionModule...
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {

  // Dữ liệu "mock" cho các thẻ KPI trên Dashboard
  kpiCards = [
    {
      title: 'Doanh thu Tháng (MRR)',
      value: '120.500.000đ',
      percent: 5.2,
      isPositive: true,
      icon: 'payments',
      color: 'primary'
    },
    {
      title: 'Khách hàng mới (Tháng)',
      value: '+45',
      percent: 10,
      isPositive: true,
      icon: 'store',
      color: 'accent'
    },
    {
      title: 'Tỷ lệ rời bỏ (Churn)',
      value: '1.8%',
      percent: -0.5,
      isPositive: false,
      icon: 'trending_down',
      color: 'warn'
    },
    {
      title: 'Đăng ký Dùng thử mới',
      value: '+120',
      percent: 15,
      isPositive: true,
      icon: 'person_add',
      color: 'info'
    }
  ];

  // Dữ liệu "mock" cho hoạt động gần đây
  recentActivities = [
    { user: 'Cầm đồ Minh Long', action: 'vừa đăng ký Gói Chuyên nghiệp.', time: '5 phút trước' },
    { user: 'Admin Hùng', action: 'vừa khóa tài khoản [Tiệm Vàng ABC].', time: '1 giờ trước' },
    { user: 'User trial@gmail.com', action: 'vừa đăng ký dùng thử.', time: '2 giờ trước' },
    { user: 'Hệ thống', action: 'Thanh toán của [Cầm đồ 247] thất bại.', time: '3 giờ trước' },
  ];
}
