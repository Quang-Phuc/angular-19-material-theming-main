// store-layout.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// *** 1. THÊM IMPORT CHO DIALOG ***
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// *** (Đảm bảo đường dẫn này đúng) ***
import { LicenseExpiredDialogComponent } from '../../../core/dialogs/license-expired-dialog/license-expired-dialog.component';

// Material modules
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
    MatButtonModule, MatExpansionModule,
    MatDialogModule // <-- 2. THÊM MODULE DIALOG VÀO IMPORTS
  ],
  templateUrl: './store-layout.component.html',
  styleUrl: './store-layout.component.scss'
})
export class StoreLayoutComponent implements OnInit {

  private authService = inject(AuthService);
  private licenseService = inject(LicenseService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  // *** 3. INJECT MATDIALOG ***
  private dialog = inject(MatDialog);

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
        const errorBody = err?.error; // Lấy phần body của lỗi
        let errorCode = null;
        let errorMessage = 'Lỗi không xác định';

        // Kiểm tra xem errorBody có phải object và có code/messages không
        if (typeof errorBody === 'object' && errorBody !== null) {
          errorCode = errorBody.code || null;
          // Ưu tiên thông báo tiếng Việt
          errorMessage = errorBody.messages?.vn || errorBody.messages?.en || errorBody.message || JSON.stringify(errorBody);
        } else if (typeof errorBody === 'string') {
          // Nếu body chỉ là string, thử parse JSON
          try {
            const parsed = JSON.parse(errorBody);
            errorCode = parsed.code || null;
            errorMessage = parsed.messages?.vn || parsed.messages?.en || parsed.message || JSON.stringify(parsed);
          } catch {
            // Nếu không parse được, dùng string gốc
            errorMessage = errorBody;
            // Cố gắng tìm mã lỗi trong string (ít chính xác)
            if (errorBody.includes('"code": "SS004"')) {
              errorCode = 'SS004';
            }
          }
        } else {
          // Nếu không có body hoặc không xác định được, dùng message gốc
          errorMessage = err?.message || 'Lỗi không xác định';
        }


        // *** 4. SỬA LOGIC XỬ LÝ LỖI ***
        if (errorCode === 'SS004') {
          // Thay vì showError + navigate -> Gọi hàm mở dialog
          this.openLicenseDialog();
        } else {
          // Lỗi khác thì logout
          this.notification.showError(errorMessage);
          this.authService.logout();
        }
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
  logout(): void { this.authService.logout();}

  /**
   * 5. THÊM HÀM MỞ DIALOG (Giống login.component.ts)
   */
  private openLicenseDialog(): void {
    const dialogRef = this.dialog.open(LicenseExpiredDialogComponent, {
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        // Nếu nhấn "Gia hạn ngay", chuyển đến trang mua
        this.router.navigate(['/purchase-license']);
      } else {
        // Nếu nhấn "Để sau", có thể logout hoặc ở lại trang lỗi
        this.notification.showError('Bạn cần gia hạn license để tiếp tục.');
        this.authService.logout(); // Logout người dùng
      }
    });
  }
}
