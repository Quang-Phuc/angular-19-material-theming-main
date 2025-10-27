// store-layout.component.ts (File mới)

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Import các module cho layout
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion'; // Cho menu đa cấp

// Import AuthService để kiểm tra vai trò
import { AuthService } from '../../../core/services/auth.service';

// Định nghĩa 1 item menu
interface NavItem {
  name: string;
  icon: string;
  route?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-store-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule
  ],
  templateUrl: './store-layout.component.html',
  styleUrl: './store-layout.component.scss'
})
export class StoreLayoutComponent implements OnInit {

  private authService = inject(AuthService);

  // Đây là nơi chứa menu của bạn
  menuItems: NavItem[] = [];

  // MENU CHO CHỦ TIỆM (Role "1")
  private ownerMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    { name: 'Hợp đồng', icon: 'description', route: '/store/contracts' },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Quản lý Nhân viên', icon: 'manage_accounts', route: '/store/staff' },
    { name: 'Báo cáo', icon: 'bar_chart', route: '/store/reports' },
    { name: 'Cài đặt Tiệm', icon: 'settings', route: '/store/settings' },
  ];

  // MENU CHO NHÂN VIÊN (Role "2")
  private employeeMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    { name: 'Tạo Hợp đồng', icon: 'add_circle', route: '/store/contracts/new' },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Tra cứu HĐ', icon: 'search', route: '/store/contracts/search' },
  ];

  ngOnInit(): void {
    // Kiểm tra vai trò và gán menu tương ứng
    if (this.authService.hasRole('1')) {
      this.menuItems = this.ownerMenu;
    } else if (this.authService.hasRole('2')) {
      this.menuItems = this.employeeMenu;
    } else {
      // Nếu không có vai trò hợp lệ, quay về login
      this.authService.logout();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
