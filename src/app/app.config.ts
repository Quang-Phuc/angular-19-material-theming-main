import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// *** PHẢI IMPORT 2 THỨ NÀY ***
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { importProvidersFrom } from '@angular/core';

// *** PHẢI IMPORT INTERCEPTOR ***
import { errorInterceptor } from './core/interceptors/error.interceptor'; // Kiểm tra lại đường dẫn này

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),

    // *** DÒNG NÀY PHẢI GIỐNG HỆT NHƯ VẦY ***
    provideHttpClient(withInterceptors([errorInterceptor])),

    importProvidersFrom(MatSnackBarModule)
  ]
};
