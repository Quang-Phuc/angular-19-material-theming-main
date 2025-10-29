// src/app/core/services/license-package.service.ts (TỆP MỚI)

import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LicensePackage } from '../models/license-package.model';

@Injectable({
  providedIn: 'root'
})
export class LicensePackageService {
  private api = inject(ApiService);
  private endpoint = '/license-packages'; // Giả định endpoint API

  /**
   * Lấy tất cả các gói license (không phân trang)
   */
  getLicensePackages(): Observable<LicensePackage[]> {
    // Giả sử API trả về một mảng
    // Nếu API trả về cấu trúc { data: [...] }, bạn cần .pipe(map(res => res.data))
    return this.api.get<LicensePackage[]>(this.endpoint);
  }

  /**
   * Lấy chi tiết một gói
   */
  getLicensePackageById(id: number): Observable<LicensePackage> {
    return this.api.get<LicensePackage>(`${this.endpoint}/${id}`);
  }

  /**
   * Tạo gói mới
   */
  createLicensePackage(data: Partial<LicensePackage>): Observable<LicensePackage> {
    return this.api.post<LicensePackage>(this.endpoint, data);
  }

  /**
   * Cập nhật gói
   */
  updateLicensePackage(id: number, data: Partial<LicensePackage>): Observable<LicensePackage> {
    return this.api.put<LicensePackage>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Xóa gói
   */
  deleteLicensePackage(id: number): Observable<any> {
    return this.api.delete<any>(`${this.endpoint}/${id}`);
  }
}
