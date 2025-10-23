import { Routes } from '@angular/router';
// Các component cũ của bạn
import { AddressFormComponent } from './address-form/address-form.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TableComponent } from './table/table.component';
import { HomepageComponent } from './features/homepage/homepage.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// === CÁC IMPORT MỚI CHO BỐ CỤC ADMIN ===
// 1. Import "Vỏ" Layout (chứa Header, Sidenav, Footer)
import { AdminLayoutComponent } from './features/admin/layout/admin-layout/admin-layout.component';
// 2. Import trang "Tổng quan" (sẽ nằm BÊN TRONG vỏ)
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';

export const routes: Routes = [
  // --- CÁC ROUTE CŨ CỦA BẠN (Giữ nguyên) ---
  {
    path: '',
    component: DashboardComponent //
  },
  {
    path: 'address',
    component: AddressFormComponent //
  },
  {
    path: 'table',
    component: TableComponent //
  },
  {
    path: 'home',
    component: HomepageComponent //
  },
  {
    path: 'login',
    component: LoginComponent //
  },
  {
    path: 'register',
    component: RegisterComponent //
  },

  // --- CẤU TRÚC ROUTE MỚI CHO ADMIN (Chuyên nghiệp) ---
  {
    path: 'admin',
    component: AdminLayoutComponent, // 1. Tải "Vỏ" (Layout)
    // canActivate: [authGuard], // (Bạn sẽ thêm Guard bảo vệ ở đây sau)

    // 2. Các trang con sẽ được hiển thị bên trong <router-outlet> của AdminLayoutComponent
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent // Trang Tổng quan
      },
      // (Đây là nơi bạn thêm các trang admin khác sau này)
      // { path: 'stores', component: StoreListComponent },
      // { path: 'plans', component: PlanListComponent },

      // 3. Tự động chuyển hướng /admin -> /admin/dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
