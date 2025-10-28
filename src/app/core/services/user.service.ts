// /core/services/user.service.ts (CẬP NHẬT)

import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserListResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private api = inject(ApiService);
  private endpoint = '/users'; // Đường dẫn API quản lý người dùng

  // (Các hàm CRUD... get, create, update, delete)
  getUsers(params: HttpParams): Observable<UserListResponse> {
    return this.api.get<UserListResponse>(this.endpoint, params);
  }
  getUserById(id: string): Observable<User> {
    return this.api.get<User>(`${this.endpoint}/${id}`);
  }
  createUser(data: Partial<User>): Observable<User> {
    return this.api.post<User>(this.endpoint, data);
  }
  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.api.put<User>(`${this.endpoint}/${id}`, data);
  }
  deleteUser(id: string): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * === HÀM MỚI: GỬI QUÊN MẬT KHẨU ===
   * Gửi một yêu cầu POST đến endpoint /forgot-password
   */
  sendPasswordReset(email: string): Observable<any> {
    // API endpoint này là giả định, bạn cần thay đổi cho đúng với backend
    return this.api.post<any>(`${this.endpoint}/forgot-password`, { email });
  }
}
