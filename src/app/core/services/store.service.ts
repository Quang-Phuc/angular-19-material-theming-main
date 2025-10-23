import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Store, StoreListResponse } from '../models/store.model';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private api = inject(ApiService);
  private endpoint = '/stores'; // Đường dẫn API quản lý tiệm

  /**
   * Hàm common lấy danh sách Tiệm (có phân trang, tìm kiếm)
   */
  getStores(params: HttpParams): Observable<StoreListResponse> {
    // Ví dụ: GET /stores?page=1&limit=10&status=active
    return this.api.get<StoreListResponse>(this.endpoint, params);
  }

  /**
   * Lấy chi tiết 1 Tiệm
   */
  getStoreById(id: string): Observable<Store> {
    return this.api.get<Store>(`${this.endpoint}/${id}`);
  }

  /**
   * Tạo Tiệm mới
   */
  createStore(data: Partial<Store>): Observable<Store> {
    return this.api.post<Store>(this.endpoint, data);
  }

  /**
   * Cập nhật Tiệm
   */
  updateStore(id: string, data: Partial<Store>): Observable<Store> {
    return this.api.put<Store>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Xóa Tiệm
   */
  deleteStore(id: string): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}`);
  }
}
