// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { importProvidersFrom } from '@angular/core';

import { provideNativeDateAdapter } from '@angular/material/core';

// ✅ IMPORT CẢ HAI INTERCEPTOR
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),

    // ✅ Đăng ký 1 lần, truyền mảng interceptor theo thứ tự
    // Gợi ý: để auth trước, error sau.
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor,
      ])
    ),

    importProvidersFrom(MatSnackBarModule),

    provideNativeDateAdapter(),
  ]
};
