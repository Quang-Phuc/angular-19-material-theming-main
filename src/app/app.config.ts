import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http'; // <-- THÊM DÒNG NÀY
import { MatSnackBarModule } from '@angular/material/snack-bar'; // <-- THÊM DÒNG NÀY
import { importProvidersFrom } from '@angular/core'; // <-- THÊM DÒNG NÀY

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(), // <-- THÊM VÀO PROVIDERS
    importProvidersFrom(MatSnackBarModule) // <-- THÊM VÀO PROVIDERS
  ]
};
