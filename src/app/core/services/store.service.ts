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

  // Thêm hàm này vào tệp store.service.ts, bên trong class StoreService

  /**
   * Lấy danh sách tiệm rút gọn cho dropdown (không phân trang)
   */
  getStoreDropdownList(): Observable<any[]> {
    // Giả sử API có endpoint /stores/dropdown trả về [{ storeId: 1, storeName: 'Tiệm A' }, ...]
    // Nếu không có, bạn có thể dùng tạm:
    // const params = new HttpParams().set('size', 1000); // Lấy 1000 tiệm
    // return this.api.get<any>(this.endpoint, params).pipe(map(res => res.data.content));

    return this.api.get<any[]>(`${this.endpoint}/dropdown`);
  }
}
