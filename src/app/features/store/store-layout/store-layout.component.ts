// store-layout.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Imports Dialog (Giữ nguyên)
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LicenseExpiredDialogComponent } from '../../../core/dialogs/license-expired-dialog/license-expired-dialog.component';

// Material modules (Giữ nguyên)
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

// Services (Giữ nguyên)
import { AuthService } from '../../../core/services/auth.service';
import { LicenseService } from '../../../core/services/license.service';
import { NotificationService } from '../../../core/services/notification.service';

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
    MatButtonModule, MatExpansionModule,
    MatDialogModule // Module Dialog
  ],
  templateUrl: './store-layout.component.html',
  styleUrl: './store-layout.component.scss'
})
export class StoreLayoutComponent implements OnInit {

  private authService = inject(AuthService);
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  menuItems: NavItem[] = [];

  // *** 1. CẬP NHẬT OWNER MENU ***
  private ownerMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    // (Các menu cũ giữ nguyên)
    { name: 'Quản lý Hợp đồng', icon: 'description', children: [ /* ... */ ]},
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Quản lý Nhân viên', icon: 'manage_accounts', route: '/store/staff' },
    // *** THÊM MENU MỚI VÀO ĐÂY ***
    {
      name: 'Quản lý License',
      icon: 'verified_user', // Hoặc 'admin_panel_settings', 'security'
      route: '/store/license-history' // <-- Trỏ đến route của trang License History
    },
    { name: 'Báo cáo', icon: 'bar_chart', children: [ /* ... */ ] },
    { name: 'Cài đặt Tiệm', icon: 'settings', route: '/store/settings' },
  ];

  // (Employee menu giữ nguyên)
  private employeeMenu: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', route: '/store/dashboard' },
    { name: 'Tạo Hợp đồng', icon: 'add_circle', route: '/store/contracts/new' },
    { name: 'Khách hàng', icon: 'people', route: '/store/customers' },
    { name: 'Tra cứu HĐ', icon: 'search', route: '/store/contracts/search' },
  ];


  ngOnInit(): void {
    // (Logic gọi API và xử lý lỗi SS004 giữ nguyên)
    this.licenseService.fetchCurrentUsage().subscribe({
      next: (usage) => {
        console.log('License valid, usage:', usage);
        this.loadMenuBasedOnRole(); // Gọi hàm load menu
      },
      error: (err) => {
        // (Xử lý lỗi SS004 giữ nguyên)
        const errorBody = err?.error;
        let errorCode = null;
        let errorMessage = 'Lỗi không xác định';
        if (typeof errorBody === 'object' && errorBody !== null) {
          errorCode = errorBody.code || null;
          errorMessage = errorBody.messages?.vn || errorBody.messages?.en || errorBody.message || JSON.stringify(errorBody);
        } else if (typeof errorBody === 'string') {
          try {
            const parsed = JSON.parse(errorBody);
            errorCode = parsed.code || null;
            errorMessage = parsed.messages?.vn || parsed.messages?.en || parsed.message || JSON.stringify(parsed);
          } catch { errorMessage = errorBody; if (errorBody.includes('"code": "SS004"')) { errorCode = 'SS004'; } }
        } else { errorMessage = err?.message || 'Lỗi không xác định'; }

        if (errorCode === 'SS004') {
          this.openLicenseDialog();
        } else {
          this.notification.showError(errorMessage);
          this.authService.logout();
        }
      }
    });
  }

  loadMenuBasedOnRole(): void {
    const roles = this.authService.getUserRoles(); // Lấy roles từ AuthService
    console.log('User Roles:', roles); // Log roles để kiểm tra

    // *** 2. ĐẢM BẢO LOGIC NÀY ĐÚNG ***
    // (Kiểm tra xem role '1' hoặc '2' có trong mảng roles không)
    if (roles.includes('1') || roles.includes('2')) {
      this.menuItems = this.ownerMenu; // Gán menu chủ shop (đã có mục License)
    } else if (roles.includes('3')) {
      this.menuItems = this.employeeMenu; // Gán menu nhân viên
    } else {
      console.error('Role không hợp lệ:', roles);
      this.authService.logout();
    }
  }

  logout(): void { this.authService.logout();}

  // (Hàm openLicenseDialog giữ nguyên)
  private openLicenseDialog(): void {
    const dialogRef = this.dialog.open(LicenseExpiredDialogComponent, {
      width: '450px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.router.navigate(['/purchase-license']);
      } else {
        this.notification.showError('Bạn cần gia hạn license để tiếp tục.');
        this.authService.logout();
      }
    });
  }
}
