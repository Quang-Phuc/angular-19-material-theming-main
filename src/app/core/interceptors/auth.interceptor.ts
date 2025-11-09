// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * Interceptor tự gắn Authorization từ localStorage('authToken') cho mọi request.
 * - Nếu chưa có token => không gắn (ví dụ /auth/login).
 * - Nếu header Authorization đã tồn tại => giữ nguyên (không đè).
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return next(req);
  }

  // Nếu đã có Authorization do nơi khác set thì giữ nguyên
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
