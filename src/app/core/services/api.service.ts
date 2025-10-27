import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  /**
   * Lấy URL API gốc từ file environment
   */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Hàm GET chung
   * @param endpoint Đường dẫn (ví dụ: '/users')
   * @param params Các query params (ví dụ: { page: 1, limit: 10 })
   */
  get<T>(endpoint: string, params?: HttpParams | { [param: string]: string | string[] }): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    return this.http.get<T>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Hàm POST chung
   * @param endpoint Đường dẫn (ví dụ: '/auth/register')
   * @param data Dữ liệu body
   */
  post<T>(endpoint: string, data: unknown): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    return this.http.post<T>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Hàm PUT chung
   * @param endpoint Đường dẫn (ví dụ: '/users/123')
   * @param data Dữ liệu body
   */
  put<T>(endpoint: string, data: unknown): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    return this.http.put<T>(url, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Hàm DELETE chung
   * @param endpoint Đường dẫn (ví dụ: '/users/123')
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    return this.http.delete<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Hàm xử lý lỗi "common" (chung)
   * Đây là nơi duy nhất xử lý lỗi HTTP
   */
  /**
   * Hàm xử lý lỗi "common" (chung)
   * Đây là nơi duy nhất xử lý lỗi HTTP
   */
  private handleError(error: HttpErrorResponse) {
    // 🔥 Giữ nguyên lỗi gốc để component có thể đọc được JSON từ BE
    return throwError(() => error);
  }

}
