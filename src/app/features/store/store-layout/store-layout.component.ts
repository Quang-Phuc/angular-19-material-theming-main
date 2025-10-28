// store-layout.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// (Các import Material modules giữ nguyên)
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

// Interface (Giữ nguyên)
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
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule,
    MatButtonModule, MatExpansionModule
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
  // private isLoadingLicense = true; // <-- 1. ĐÃ XÓA

  // Menus (Giữ nguyên)
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


  /**
   * 2. CẬP NHẬT ngOnInit
   * Sẽ gọi API lấy usage (thay vì check status).
   * API này nếu lỗi sẽ trả về SS004.
   */
  ngOnInit(): void {
    // Gọi API lấy thông tin usage (store/user)
    this.licenseService.fetchCurrentUsage().subscribe({
      next: (usage) => {
        // Nếu thành công, load menu
        console.log('License valid, usage:', usage);
        this.loadMenuBasedOnRole();
      },
      error: (err) => {
        // 3. XỬ LÝ LỖI THEO YÊU CẦU MỚI (SS004)

        // (Giả định ApiService/Interceptor đã parse lỗi)
        const errorCode = err?.error?.errorCode || err?.errorCode || null;
        const errorMessage = err?.error?.message || err?.message || 'Lỗi không xác định';

        if (errorCode === 'SS004') { //
          this.notification.showError('License của bạn đã hết hạn. Vui lòng gia hạn.');
          // Giống logic cũ: chuyển hướng
          this.router.navigate(['/purchase-license']);
        } else {
          // Lỗi nghiêm trọng khác (500, 401, v.v...)
          this.notification.showError(errorMessage);
          this.authService.logout();
        }
      }
    });
  }

  loadMenuBasedOnRole(): void {
    // (Giữ nguyên)
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
    // (Giữ nguyên)
    this.authService.logout();
  }
}
