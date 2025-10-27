import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Plan, PaginatedPlanResponse } from '../models/plan.model';

// DỮ LIỆU GIẢ (MOCK DATA) - Thay thế bằng API thật
const MOCK_PLANS: Plan[] = [
  {
    id: '1',
    name: 'Dùng thử',
    code: 'trial',
    priceMonth: 0,
    maxBranches: 1,
    maxUsers: 1,
    maxContracts: 50,
    features: { hasMobileApp: true, hasZaloSms: false, hasAdvancedReport: false, hasApiAccess: false, hasPrioritySupport: false },
    status: 'active',
    isHighlighted: false,
    trialDays: 7,
  },
  {
    id: '2',
    name: 'Cơ bản',
    code: 'standard',
    priceMonth: 150000,
    maxBranches: 1,
    maxUsers: 3,
    maxContracts: 1000,
    features: { hasMobileApp: true, hasZaloSms: true, hasAdvancedReport: false, hasApiAccess: false, hasPrioritySupport: false },
    status: 'active',
    isHighlighted: true, // Gói này nổi bật
  },
  {
    id: '3',
    name: 'Chuyên nghiệp',
    code: 'pro',
    priceMonth: 300000,
    maxBranches: 5,
    maxUsers: 10,
    maxContracts: 10000,
    features: { hasMobileApp: true, hasZaloSms: true, hasAdvancedReport: true, hasApiAccess: false, hasPrioritySupport: true },
    status: 'active',
    isHighlighted: false,
  },
  {
    id: '4',
    name: 'Doanh nghiệp',
    code: 'enterprise',
    priceMonth: 700000,
    maxBranches: 999, // Không giới hạn
    maxUsers: 999, // Không giới hạn
    maxContracts: 999999,
    features: { hasMobileApp: true, hasZaloSms: true, hasAdvancedReport: true, hasApiAccess: true, hasPrioritySupport: true },
    status: 'active',
    isHighlighted: false,
  },
  {
    id: '5',
    name: 'Gói Tiệm Vàng',
    code: 'gold-shop-v1',
    priceMonth: 400000,
    maxBranches: 3,
    maxUsers: 5,
    features: { hasMobileApp: true, hasZaloSms: true, hasAdvancedReport: true, hasApiAccess: false, hasPrioritySupport: false },
    status: 'inactive', // Gói này đã ngừng
    isHighlighted: false,
  },
];
// KẾT THÚC MOCK DATA

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  // Thay thế bằng API endpoint thật của bạn
  private apiUrl = '/api/v1/admin/plans';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách các gói (có phân trang và lọc)
   * Sử dụng MOCK DATA thay vì API thật
   */
  getPlans(params: HttpParams): Observable<PaginatedPlanResponse> {
    console.log('Fetching plans with params:', params.toString());

    // --- Giả lập logic lọc và phân trang từ MOCK_PLANS ---
    let filteredPlans = [...MOCK_PLANS];
    const q = params.get('q')?.toLowerCase();
    const status = params.get('status');
    const isHighlighted = params.get('isHighlighted');

    // Lọc theo tìm kiếm cơ bản (tên, mã)
    if (q) {
      filteredPlans = filteredPlans.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      );
    }

    // Lọc theo trạng thái
    if (status) {
      filteredPlans = filteredPlans.filter(p => p.status === status);
    }

    // Lọc theo nổi bật
    if (isHighlighted !== null && isHighlighted !== undefined) {
      const highlightBool = isHighlighted === 'true';
      filteredPlans = filteredPlans.filter(p => p.isHighlighted === highlightBool);
    }

    // Lấy tổng số kết quả
    const total = filteredPlans.length;

    // Giả lập Sắp xếp
    const sort = params.get('sort') || 'name';
    const order = params.get('order') || 'asc';
    filteredPlans.sort((a, b) => {
      const valA = a[sort as keyof Plan];
      const valB = b[sort as keyof Plan];
      let comparison = 0;

      // [FIX] Xử lý trường hợp giá trị là null hoặc undefined
      if (valA == null && valB == null) {
        comparison = 0; // Cả hai đều null/undefined, coi như bằng nhau
      } else if (valA == null) {
        comparison = 1; // valA là null, đẩy xuống cuối
      } else if (valB == null) {
        comparison = -1; // valB là null, đẩy xuống cuối
      } else {
        // Cả hai đều có giá trị, tiến hành so sánh
        if (valA > valB) {
          comparison = 1;
        } else if (valA < valB) {
          comparison = -1;
        }
      }

      return order === 'desc' ? comparison * -1 : comparison;
    });

    // Giả lập Phân trang
    const page = +(params.get('page') || 1);
    const limit = +(params.get('limit') || 10);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredPlans.slice(startIndex, endIndex);

    const response: PaginatedPlanResponse = {
      data: paginatedData,
      total: total,
      page: page,
      limit: limit
    };

    // Giả lập độ trễ API
    return of(response).pipe(delay(500));
    // --- KẾT THÚC GIẢ LẬP ---

    /*
    // CODE API THẬT SẼ NHƯ SAU:
    return this.http.get<PaginatedPlanResponse>(this.apiUrl, { params });
    */
  }

  /**
   * Xóa một gói (MOCK)
   */
  deletePlan(id: string): Observable<any> {
    const index = MOCK_PLANS.findIndex(p => p.id === id);
    if (index > -1) {
      MOCK_PLANS.splice(index, 1);
      return of({ success: true }).pipe(delay(300)); // Giả lập thành công
    } else {
      return throwError(() => new Error('Không tìm thấy gói để xóa')).pipe(delay(300));
    }

    /*
    // CODE API THẬT SẼ NHƯ SAU:
    return this.http.delete(`${this.apiUrl}/${id}`);
    */
  }

  // Các hàm khác (createPlan, updatePlan) sẽ được gọi từ Dialog
}

