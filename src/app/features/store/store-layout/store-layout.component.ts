// store-layout.component.ts (Updated for Multi-level Menu)

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Material modules
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
// Keep Expansion Module for potential top-level grouping if desired
import { MatExpansionModule } from '@angular/material/expansion';

// AuthService
import { AuthService } from '../../../core/services/auth.service';

// Updated NavItem Interface (Recursive)
interface NavItem {
  name: string;
  icon: string;
  route?: string;
  children?: NavItem[]; // Allows nesting
  level?: number; // Optional: To track nesting level for styling
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
    MatExpansionModule // Keep if using expansion panels
  ],
  templateUrl: './store-layout.component.html', // cite: 0
  styleUrl: './store-layout.component.scss' // cite: 1
})
export class StoreLayoutComponent implements OnInit {

  private authService = inject(AuthService);
  menuItems: NavItem[] = [];

  // === UPDATED MENU DATA WITH NESTING ===

  // OWNER MENU (Role "2")
  private ownerMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard', level: 1 },
    {
      name: 'Quản lý Hợp đồng', icon: 'description', level: 1, children: [
        { name: 'Tạo Hợp đồng mới', icon: 'add_circle_outline', route: '/store/contracts/new', level: 2 },
        { name: 'Danh sách Hợp đồng', icon: 'list_alt', route: '/store/contracts', level: 2 },
        { name: 'Tra cứu', icon: 'search', route: '/store/contracts/search', level: 2 }
      ]
    },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers', level: 1 },
    { name: 'Quản lý Nhân viên', icon: 'manage_accounts', route: '/store/staff', level: 1 },
    {
      name: 'Báo cáo', icon: 'bar_chart', level: 1, children: [
        { name: 'Doanh thu', icon: 'trending_up', route: '/store/reports/revenue', level: 2 },
        { name: 'Công nợ', icon: 'receipt_long', route: '/store/reports/debt', level: 2 },
        {
          name: 'Hàng hóa', icon: 'inventory_2', level: 2, children: [ // Level 3 Example
            { name: 'Tồn kho', icon: 'inventory', route: '/store/reports/stock', level: 3 },
            { name: 'Thanh lý', icon: 'sell', route: '/store/reports/liquidation', level: 3 }
          ]
        }
      ]
    },
    { name: 'Cài đặt Tiệm', icon: 'settings', route: '/store/settings', level: 1 },
  ];

  // EMPLOYEE MENU (Role "3")
  private employeeMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard', level: 1 },
    { name: 'Tạo Hợp đồng', icon: 'add_circle', route: '/store/contracts/new', level: 1 },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers', level: 1 },
    { name: 'Tra cứu HĐ', icon: 'search', route: '/store/contracts/search', level: 1 },
  ];

  ngOnInit(): void {
    if (this.authService.hasRole('2')) {
      this.menuItems = this.ownerMenu;
    } else if (this.authService.hasRole('3')) {
      this.menuItems = this.employeeMenu;
    } else {
      this.authService.logout();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
