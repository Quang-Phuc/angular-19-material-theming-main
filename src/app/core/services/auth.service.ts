import { Injectable, inject } from '@angular/core';
// THÊM throwError TỪ 'rxjs'
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
// THÊM catchError TỪ 'rxjs/operators'
import { map, tap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service'; // Dịch vụ API common
import { User } from '../models/user.model';
import { Router } from '@angular/router';

// Định nghĩa các kiểu dữ liệu cho payload
export interface RegisterPayload {
  storeName: string | null | undefined;
  phone: string | null | undefined;
  password: string | null | undefined;
}
export interface LoginPayload {
  phone: string | null | undefined;
  password: string | null | undefined;
}
// (Đây là cấu trúc API trả về, bạn hãy sửa lại cho đúng)
interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  // Dùng BehaviorSubject để toàn bộ ứng dụng biết ai đang đăng nhập
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Khi ứng dụng mới tải, kiểm tra xem có token cũ không
    this.loadTokenFromStorage();
  }

  /**
   * Lấy token hiện tại từ localStorage
   */
  public getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Tải token khi khởi động
   */
  private loadTokenFromStorage(): void {
    const token = this.getToken();
    if (token) {
      // (Lý tưởng nhất là bạn nên gọi API /auth/me ở đây để xác thực token)
      // Tạm thời, chúng ta lấy thông tin user đã lưu
      const user = localStorage.getItem('current_user');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  // =============================================
  // === CÁC HÀM KHÔNG CẦN TOKEN (PUBLIC) ===
  // =============================================

  /**
   * Hàm Đăng ký (Register)
   * === ĐÃ CẬP NHẬT HÀM NÀY ===
   */
  register(payload: RegisterPayload): Observable<any> {
    // Interceptor sẽ thấy URL này và KHÔNG gắn token
    return this.api.post<any>('/auth/register', payload).pipe(
      // Bắt lỗi gốc (HttpErrorResponse)
      catchError(err => {
        // Ném lỗi gốc này về cho component
        // Component (register.component.ts) sẽ nhận được đầy đủ body lỗi
        return throwError(() => err);
      })
    );
  }

  /**
   * Hàm Đăng nhập (Login)
   */
  login(payload: LoginPayload): Observable<User> {
    // Interceptor sẽ thấy URL này và KHÔNG gắn token
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      tap(response => {
        // === LƯU TOKEN VÀ USER ===
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('current_user', JSON.stringify(response.user));

        // Thông báo cho toàn ứng dụng biết đã đăng nhập
        this.currentUserSubject.next(response.user);
      }),
      map(response => response.user), // Chỉ trả về user cho component

      // Bạn cũng nên thêm catchError ở đây cho hàm login
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  /**
   * Hàm Đăng xuất
   */
  logout(): void {
    // === XÓA TOKEN VÀ USER ===
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');

    // Thông báo cho toàn ứng dụng
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']); // Về trang đăng nhập
  }

  // =============================================
  // === CÁC HÀM CẦN TOKEN (PRIVATE) ===
  // =============================================

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getMe(): Observable<User> {
    // Hàm này không cần làm gì cả.
    // Interceptor sẽ TỰ ĐỘNG gắn token vào request này.
    return this.api.get<User>('/auth/me');
  }

  /**
   * Lấy danh sách khách hàng (Ví dụ)
   */
  getCustomers(): Observable<any> {
    // Interceptor cũng sẽ TỰ ĐỘNG gắn token vào request này.
    return this.api.get<any>('/customers');
  }
}
