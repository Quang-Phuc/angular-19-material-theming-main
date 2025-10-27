import { Routes } from '@angular/router';
// ... (các import cũ của bạn)
import { HomepageComponent } from './features/homepage/homepage.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

// === CÁC IMPORT MỚI CHO BỐ CỤC ADMIN ===
import { AdminLayoutComponent } from './features/admin/layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';
import { StoreListComponent } from './features/admin/pages/store-list/store-list.component';
import { PlanListComponent } from './features/admin/components/plan-list/plan-list.component';
// Import component login admin
import { AdminLoginComponent } from './features/admin/pages/admin-login/admin-login.component';


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

  // --- TRANG LOGIN ADMIN (ĐẶT Ở NGOÀI ĐỂ KHÔNG CÓ LAYOUT) ---
  {
    path: 'admin/login', // <-- 1. Đưa route login admin ra cấp cao nhất
    component: AdminLoginComponent
  },

  // --- CẤU TRÚC ROUTE CHO ADMIN (CÁC TRANG CÓ LAYOUT) ---
  {
    path: 'admin',
    component: AdminLayoutComponent, // 2. Tải "Vỏ" (Layout)
    // canActivate: [authGuard], // <== Sau này bạn sẽ đặt Guard ở đây

    children: [ // 3. Các trang con sẽ nằm BÊN TRONG layout
      {
        path: 'dashboard', // <-- Bỏ 'login' ra khỏi đây
        component: AdminDashboardComponent // Trang Tổng quan
      },
      {
        path: 'stores/list',
        component: StoreListComponent
      },
      {
        path: 'plans',
        component: PlanListComponent
      },
      // (Thêm các trang admin khác ở đây)

      // 4. Redirect từ /admin (rỗng) sang /admin/dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
