// store-layout.component.ts (Updated for New Template)

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Material modules
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion'; // Cần cho menu con

// AuthService
import { AuthService } from '../../../core/services/auth.service';

// Interface (Bỏ `level`)
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
    MatExpansionModule // <-- Giữ lại
  ],
  templateUrl: './store-layout.component.html', // cite: 0
  styleUrl: './store-layout.component.scss' // cite: 1
})
export class StoreLayoutComponent implements OnInit {

  private authService = inject(AuthService);
  menuItems: NavItem[] = [];

  // OWNER MENU (Role "2") - Bỏ `level`
  private ownerMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    {
      name: 'Quản lý Hợp đồng', icon: 'description', children: [
        { name: 'Tạo Hợp đồng mới', icon: 'add_circle_outline', route: '/store/contracts/new' },
        { name: 'Danh sách Hợp đồng', icon: 'list_alt', route: '/store/contracts' },
        { name: 'Tra cứu', icon: 'search', route: '/store/contracts/search' }
      ]
    },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Quản lý Nhân viên', icon: 'manage_accounts', route: '/store/staff' },
    {
      name: 'Báo cáo', icon: 'bar_chart', children: [
        { name: 'Doanh thu', icon: 'trending_up', route: '/store/reports/revenue' },
        { name: 'Công nợ', icon: 'receipt_long', route: '/store/reports/debt' },
        // (Menu con cấp 3 hiện tại không được hỗ trợ bởi HTML mới, cần làm phẳng)
        { name: 'Tồn kho', icon: 'inventory', route: '/store/reports/stock' },
        { name: 'Thanh lý', icon: 'sell', route: '/store/reports/liquidation' }
      ]
    },
    { name: 'Cài đặt Tiệm', icon: 'settings', route: '/store/settings' },
  ];

  // EMPLOYEE MENU (Role "3") - Bỏ `level`
  private employeeMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    { name: 'Tạo Hợp đồng', icon: 'add_circle', route: '/store/contracts/new' },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Tra cứu HĐ', icon: 'search', route: '/store/contracts/search' },
  ];

  ngOnInit(): void {
    const roles = this.authService.getUserRoles();
    if (roles.includes('1') || roles.includes('2')) {
      this.menuItems = this.ownerMenu;
    } else if (roles.includes('3')) {
      this.menuItems = this.employeeMenu;
    } else {
      this.authService.logout();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
