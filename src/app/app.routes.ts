// app.routes.ts

import { Routes } from '@angular/router';

// Public/Auth routes
import { HomepageComponent } from './features/homepage/homepage.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { PurchaseLicenseComponent } from './features/public/purchase-license/purchase-license.component';

// Admin routes
import { AdminLayoutComponent } from './features/admin/layout/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/pages/dashboard/admin-dashboard.component';
import { StoreListComponent } from './features/admin/pages/store-list/store-list.component';
import { PlanListComponent } from './features/admin/components/plan-list/plan-list.component';
import { AdminLoginComponent } from './features/admin/pages/admin-login/admin-login.component';

// Store management routes (NEW)
import { StoreLayoutComponent } from './features/store/store-layout/store-layout.component';
import { StoreDashboardComponent } from './features/store/store-dashboard/store-dashboard.component';
import {LicenseHistoryComponent} from './features/users/license/license-history.component';


export const routes: Routes = [
  // --- Public Routes ---
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
  {
    path: 'purchase-license',
    component: PurchaseLicenseComponent
  },

  // --- Store Management Routes ---
  {
    path: 'store',
    component: StoreLayoutComponent, // Layout includes menu
    // canActivate: [authGuard], // Add Auth Guard here later
    children: [
      {
        path: 'dashboard',
        component: StoreDashboardComponent // Dashboard for store owner/employee
      },
      // *** 2. ADD THE NEW ROUTE HERE ***
      {
        path: 'license-history', // The missing segment
        component: LicenseHistoryComponent // Link to the component
      },
      // (Add other store management pages here, e.g., contracts, customers)

      // Redirect base /store to dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // --- Admin Routes ---
  {
    path: 'admin/login', // Standalone admin login page
    component: AdminLoginComponent
  },
  {
    path: 'admin',
    component: AdminLayoutComponent, // Admin layout
    // canActivate: [adminAuthGuard], // Add Admin Auth Guard here later
    children: [
      {
        path: 'dashboard',
        component: AdminDashboardComponent // Admin dashboard
      },
      {
        path: 'stores/list',
        component: StoreListComponent
      },
      {
        path: 'plans',
        component: PlanListComponent
      },
      // (Add other admin pages here)

      // Redirect base /admin to dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // --- Default Route ---
  // Redirect empty path to home or login as needed
  {
    path: '',
    redirectTo: '/login', // Or '/home' depending on your logic
    pathMatch: 'full'
  },

  // --- Wildcard Route (404) ---
  // Add a NotFoundComponent later
  // { path: '**', component: NotFoundComponent }
];
