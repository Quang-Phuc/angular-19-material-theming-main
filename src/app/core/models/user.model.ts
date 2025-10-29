// /core/models/user.model.ts (Tệp mới)

import { Store } from './store.model';

// Định nghĩa cơ bản cho một User
export interface User {
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  store: Store; // Lồng thông tin tiệm
  storeId?: number| null;
  type?: string;
  // Thêm các trường khác nếu cần
}

// Định nghĩa response cho API danh sách User (giống StoreListResponse)
export interface UserListResponse {
  message: string;
  data: {
    content: User[];
    pageable: any;
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: any;
    first: boolean;
    numberOfElements: number;
    empty: boolean;
  };
}
