import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // client pages
  { path: '',            loadComponent: () => import('./pages/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent) },
  { path: 'phong-thuy',  loadComponent: () => import('./pages/phong-thuy/phong-thuy-page.component').then(m => m.PhongThuyPageComponent) },
  { path: 'ai',          loadComponent: () => import('./pages/ai/ai-page.component').then(m => m.AiPageComponent) },
  { path: 'giac-mo',     loadComponent: () => import('./pages/dream/dream-page.component').then(m => m.DreamPageComponent) },
  { path: 'vietlott',    loadComponent: () => import('./pages/vietlott/vietlott-page.component').then(m => m.VietlottPageComponent) },
  { path: 'diem-mua-ve-so', loadComponent: () => import('./pages/ticket-points/ticket-points-page.component').then(m => m.TicketPointsPageComponent) },

  // login admin
  { path: 'login', loadComponent: () => import('./pages/login/login-page.component').then(m => m.LoginPageComponent) },

  // ADMIN layout + children
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'diem-mua-ve-so' },
      { path: 'diem-mua-ve-so', loadComponent: () => import('./admin/admin-points-page.component').then(m => m.AdminPointsPageComponent) },
      { path: 'vietlott',      loadComponent: () => import('./admin/admin-vietlott-page.component').then(m => m.AdminVietlottPageComponent) },
      { path: 'lottery',       loadComponent: () => import('./admin/admin-lottery-page.component').then(m => m.AdminLotteryPageComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];
