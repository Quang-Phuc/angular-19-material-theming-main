// src/app/core/services/resource-factory.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, ApiListResponse, ApiPagedResponse, ApiPage } from '../models/api.model';

type Id = string | number;

@Injectable({ providedIn: 'root' })
export class ResourceFactory {
  constructor(private api: ApiService) {}

  /** Tạo client tài nguyên REST: const stores = resources.of<ApiStore>('/v1/stores') */
  of<T>(baseUrl: string) {
    return new ResourceClient<T>(baseUrl, this.api);
  }
}

export class ResourceClient<T> {
  constructor(private base: string, private api: ApiService) {}

  /** GET /resource (list) → data: T[] */
  list(params?: Record<string, any>): Observable<ApiListResponse<T>> {
    return this.api.get<ApiListResponse<T>>(this.base, { params });
  }

  /** GET /resource (paged) → data: { content: T[], ... } */
  page(params?: Record<string, any>): Observable<ApiPagedResponse<T>> {
    return this.api.get<ApiPagedResponse<T>>(this.base, { params });
  }

  /** GET /resource/:id → data: T */
  get(id: Id, params?: Record<string, any>): Observable<ApiResponse<T>> {
    return this.api.get<ApiResponse<T>>(`${this.base}/${id}`, { params });
  }

  /** POST /resource → data: T | any */
  create(body: Partial<T>, params?: Record<string, any>): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(this.base, body, { params });
  }

  /** PUT /resource/:id */
  update(id: Id, body: Partial<T>, params?: Record<string, any>): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(`${this.base}/${id}`, body, { params });
  }

  /** DELETE /resource/:id */
  remove(id: Id, params?: Record<string, any>): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(`${this.base}/${id}`, { params });
  }

  /** Download file từ /resource/:id/download (hoặc path tuỳ chỉnh) */
  download(path: string, params?: Record<string, any>) {
    return this.api.download(`${this.base}/${path}`.replace(/\/+$/, ''), params);
  }

  /** Upload multipart tới /resource/:id/upload (hoặc path tuỳ chỉnh) */
  upload<R = any>(path: string, formData: FormData, params?: Record<string, any>) {
    return this.api.upload<ApiResponse<R>>(`${this.base}/${path}`.replace(/\/+$/, ''), formData, { params });
  }
}
