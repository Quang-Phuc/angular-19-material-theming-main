// src/app/core/services/customer.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

export interface CustomerSearchRequest {
  phoneNumber?: string;
  identityNumber?: string;
}

export interface CustomerSearchResponse {
  timeStamp: string;
  securityVersion: string;
  result: string;
  message: string;
  errorCode: string;
  data?: {
    createdBy: string;
    createdDate: string;
    lastUpdatedBy: string | null;
    lastUpdatedDate: string;
    idUrl: string | null;
    id: number;
    fullName: string;
    phoneNumber: string;
    dateOfBirth: string;
    identityNumber: string;
    issueDate: string;
    issuePlace: string;
    permanentAddress: string;
    gender: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  timeStamp: string;
  securityVersion: string;
  result: string;
  message: string;
  errorCode: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private apiUrl = '/customers/search'; // Relative path, assuming ApiService handles base URL

  constructor() { }

  // --- SEARCH CUSTOMER ---

  /**
   * Tìm kiếm khách hàng theo số điện thoại hoặc số CCCD.
   * @param request - Đối tượng chứa phoneNumber và/hoặc identityNumber
   * @returns Observable<CustomerSearchResponse> - Kết quả tìm kiếm
   */
  searchCustomer(request: CustomerSearchRequest): Observable<CustomerSearchResponse | null> {
    // Xây dựng query params
    console.log('sss2')
    let params = new HttpParams();
    if (request.phoneNumber && request.phoneNumber.trim()) {
      params = params.set('phoneNumber', request.phoneNumber.trim());
    }
    if (request.identityNumber && request.identityNumber.trim()) {
      params = params.set('identityNumber', request.identityNumber.trim());
    }

    // Kiểm tra ít nhất một trường không rỗng
    if (!params.keys().length) {
      this.notification.showError('Vui lòng nhập số điện thoại hoặc số CCCD để tìm kiếm.');
      return of(null);
    }

    // Gọi API GET với params
    console.log('sss5')
    console.log('a'+this.apiUrl)
    return this.apiService.get<ApiResponse<CustomerSearchResponse>>(this.apiUrl, params).pipe(
      map(response => {
        if (response.result === 'success' && response.data) {
          return response.data; // Trả về data của response
        } else {
          this.notification.showError('Không tìm thấy thông tin khách hàng.');
          return null;
        }
      }),
      catchError(error => {
        console.error('Search customer error:', error);
        this.notification.showError('Lỗi khi tìm kiếm khách hàng. Vui lòng thử lại.');
        return of(null);
      })
    );
  }

  /**
   * Tìm kiếm và tự động populate dữ liệu vào form (nếu cần).
   * Method này có thể được gọi từ component để xử lý populate.
   */
  searchAndPopulate(request: CustomerSearchRequest, onSuccess: (customerData: any) => void): void {
    this.searchCustomer(request).subscribe(
      (response: CustomerSearchResponse | null) => {
        if (response && response.data) {
          onSuccess(response.data); // Gọi callback với inner data
          this.notification.showSuccess('Tìm thấy thông tin khách hàng và đã điền vào form!');
        } else {
          this.notification.showError('Không có thông tin khách hàng!');
        }
      }
    );
  }

  // --- HELPER METHODS ---

  /**
   * Validate input trước khi search (optional)
   */
  private validateSearchInput(request: CustomerSearchRequest): boolean {
    const hasPhone = request.phoneNumber && request.phoneNumber.trim().length >= 10;
    const hasIdNumber = request.identityNumber && request.identityNumber.trim().length >= 9;
    if (!hasPhone && !hasIdNumber) {
      this.notification.showError('Vui lòng nhập số điện thoại (ít nhất 10 ký tự) hoặc số CCCD (ít nhất 9 ký tự).');
      return false;
    }
    return true;
  }
}
