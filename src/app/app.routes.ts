import { Routes } from '@angular/router';
// ... (các import cũ của bạn)
import { HomepageComponent } from './features/homepage/homepage.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// === CÁC IMPORT MỚI CHO BỐ CỤC ADMIN ===
import { AdminLayoutComponent } from './features/admin/layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';

// *** 1. IMPORT COMPONENT "DANH SÁCH TIỆM" CỦA BẠN VÀO ĐÂY ***
import { StoreListComponent } from './features/admin/pages/store-list/store-list.component';
import {PlanListComponent} from './features/admin/components/plan-list/plan-list.component';


export const routes: Routes = [
  // ... (các route cũ: home, login, register...)
  {
    path: 'home',
    component: HomepageComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  // ... (các route cũ khác)

  // --- CẤU TRÚC ROUTE CHO ADMIN ---
  {
    path: 'admin',
    component: AdminLayoutComponent, // 1. Tải "Vỏ" (Layout)
    // canActivate: [authGuard],

    children: [ // 2. Các trang con
      {
        path: 'dashboard',
        component: AdminDashboardComponent // Trang Tổng quan
      },

      // *** 3. THÊM ROUTE CHO "DANH SÁCH TIỆM" TẠI ĐÂY ***
      {
        path: 'stores/list', // <-- Đường dẫn này khớp với routerLink
        component: StoreListComponent // <-- Component sẽ hiển thị
      },
      {
        path: 'plans', // <-- Đường dẫn này khớp với routerLink
        component: PlanListComponent // <-- Component sẽ hiển thị
      },
      // *******************************************

      // (Thêm các trang admin khác ở đây)
      // { path: 'stores/pending', component: StorePendingComponent },
      // { path: 'plans', component: PlanListComponent },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
