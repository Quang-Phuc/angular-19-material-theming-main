// src/app/core/models/api.model.ts

/** Phong bì (envelope) chung cho MỌI API */
export interface ApiResponse<T> {
  timeStamp: string;          // ISO date string
  securityVersion: string;    // vd: "0.0.1"
  result: string;             // "success" | "error" | ...
  message: string;            // "OK" | "Created" | thông báo khác
  errorCode: string;          // "200" | "201" | ...
  data: T;                    // payload
}

/** Trường sort trong trang */
export interface ApiSort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

/** Thông tin phân trang trong trang */
export interface ApiPageable {
  sort: ApiSort;
  pageNumber: number; // chỉ số trang (0-based)
  pageSize: number;   // kích thước trang
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/** Dạng data phân trang (nằm trong ApiResponse.data) */
export interface ApiPage<T> {
  content: T[];
  pageable: ApiPageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;            // index trang hiện tại (0-based)
  sort: ApiSort;
  first: boolean;
  numberOfElements: number;  // số phần tử thực tế trong trang hiện tại
  size: number;              // kích thước trang
  empty: boolean;
}

/** Phong bì dành cho data dạng PAGE */
export type ApiPagedResponse<T> = ApiResponse<ApiPage<T>>;

/** Phong bì dành cho data dạng LIST (mảng đơn) */
export type ApiListResponse<T> = ApiResponse<T[]>;

/** Helper: lấy data ra từ envelope */
export function unwrapData<T>(resp: ApiResponse<T>): T {
  return resp?.data as T;
}

/** Type guard: kiểm tra 1 object có phải ApiPage hay không */
export function isApiPage<T = any>(d: unknown): d is ApiPage<T> {
  if (!d || typeof d !== 'object') return false;
  const anyD = d as any;
  return (
    Array.isArray(anyD.content) &&
    typeof anyD.totalElements === 'number' &&
    typeof anyD.size === 'number' &&
    typeof anyD.number === 'number'
  );
}
