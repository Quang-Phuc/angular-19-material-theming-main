// store-layout.component.ts

import { Component, inject, OnInit } from '@angular/core';
// *** Add CommonModule ***
import { CommonModule } from '@angular/common';
// *** Add RouterOutlet, RouterLink, RouterLinkActive ***
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// *** ADD ALL REQUIRED MATERIAL & ROUTER MODULES ***
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

// Services
import { AuthService } from '../../../core/services/auth.service';
import { LicenseService } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';

// Interface
interface NavItem {
  name: string;
  icon: string;
  route?: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-store-layout',
  standalone: true,
  // *** ADD MODULES TO IMPORTS ARRAY ***
  imports: [
    CommonModule,
    RouterOutlet, // Add
    RouterLink, // Add
    RouterLinkActive, // Add
    MatSidenavModule, // Add
    MatToolbarModule, // Add
    MatListModule, // Add
    MatIconModule, // Add
    MatButtonModule, // Add
    MatExpansionModule // Add
  ],
  templateUrl: './store-layout.component.html',
  styleUrl: './store-layout.component.scss'
})
export class StoreLayoutComponent implements OnInit {

  private authService = inject(AuthService);
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  menuItems: NavItem[] = [];
  isLoadingLicense = true;

  // Menus
  private ownerMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    { name: 'Quản lý Hợp đồng', icon: 'description', children: [ /* ... */ ]},
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Quản lý Nhân viên', icon: 'manage_accounts', route: '/store/staff' },
    { name: 'Báo cáo', icon: 'bar_chart', children: [ /* ... */ ] },
    { name: 'Cài đặt Tiệm', icon: 'settings', route: '/store/settings' },
  ];
  private employeeMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    { name: 'Tạo Hợp đồng', icon: 'add_circle', route: '/store/contracts/new' },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Tra cứu HĐ', icon: 'search', route: '/store/contracts/search' },
  ];


  ngOnInit(): void {
    this.isLoadingLicense = true;
    this.licenseService.checkLicenseStatus().subscribe({
      next: (status) => {
        this.isLoadingLicense = false;
        if (status.status === 'expired' || status.status === 'not_found') {
          this.notification.showError('License của bạn đã hết hạn hoặc không hợp lệ. Vui lòng gia hạn.');
          this.router.navigate(['/purchase-license']);
        } else {
          this.loadMenuBasedOnRole();
        }
      },
      error: (err) => {
        this.isLoadingLicense = false;
        this.notification.showError('Không thể kiểm tra trạng thái license. Vui lòng thử lại.');
        this.authService.logout();
      }
    });
  }

  loadMenuBasedOnRole(): void {
    const roles = this.authService.getUserRoles();
    if (roles.includes('1') || roles.includes('2')) {
      this.menuItems = this.ownerMenu;
    } else if (roles.includes('3')) {
      this.menuItems = this.employeeMenu;
    } else {
      console.error('Role không hợp lệ sau khi kiểm tra license!');
      this.authService.logout();
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
