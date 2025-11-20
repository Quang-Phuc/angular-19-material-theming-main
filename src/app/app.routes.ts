// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent) },
  { path: 'phong-thuy', loadComponent: () => import('./pages/phong-thuy/phong-thuy-page.component').then(m => m.PhongThuyPageComponent) },
  { path: 'ai',         loadComponent: () => import('./pages/ai/ai-page.component').then(m => m.AiPageComponent) },
  { path: 'giac-mo',    loadComponent: () => import('./pages/dream/dream-page.component').then(m => m.DreamPageComponent) },
  { path: 'vietlott',   loadComponent: () => import('./pages/vietlott/vietlott-page.component').then(m => m.VietlottPageComponent) },
  { path: '**', redirectTo: '' }
];
