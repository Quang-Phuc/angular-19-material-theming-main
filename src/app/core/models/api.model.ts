// src/app/core/models/api.model.ts

/**
 * Kết quả chuẩn trong envelope của backend.
 * Ví dụ: "success" | "error" | "fail" ...
 */
export type ApiResult = 'success' | 'error' | 'fail' | string;

/**
 * Envelope chung của mọi API theo chuẩn bạn cung cấp.
 * "data" sẽ là:
 *   - T[] (danh sách)
 *   - ApiPage<T> (phân trang)
 *   - T (đối tượng đơn)
 */
export interface ApiResponse<T> {
  timeStamp: string;          // "2025-11-09T22:27:09Z"
  securityVersion: string;    // "0.0.1"
  result: ApiResult;          // "success"
  message?: string | null;    // "OK" | "Created" | ...
  errorCode?: string | number | null; // "200" | "201" | ...
  data: T;
}

/** Kiểu danh sách: data là mảng T[] */
export type ApiListResponse<T> = ApiResponse<T[]>;

/** Cấu trúc sort/pageable trong đối tượng phân trang */
export interface ApiSort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface ApiPageable {
  sort: ApiSort;
  pageNumber: number; // index trang hiện tại (0-based)
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

/**
 * Cấu trúc phân trang giống hệt bạn đưa:
 * data: {
 *   content: T[],
 *   pageable: { ... },
 *   last, totalPages, totalElements, number, sort, first, numberOfElements, size, empty
 * }
 */
export interface ApiPage<T> {
  content: T[];
  pageable: ApiPageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  number: number;           // index trang hiện tại (0-based)
  sort: ApiSort;
  first: boolean;
  numberOfElements: number; // số phần tử thực tế trong trang hiện tại
  size: number;             // kích thước trang
  empty: boolean;
}

/** Alias để tương thích code cũ có thể đang dùng tên này */
export type ApiPagedData<T> = ApiPage<T>;

/** Response phân trang: data là ApiPage<T> */
export type ApiPagedResponse<T> = ApiResponse<ApiPage<T>>;

/* ======================
 *  Helpers tiện dụng
 * ======================*/

/** Kiểm tra data có phải đối tượng phân trang hay không */
export const isApiPage = <T>(data: unknown): data is ApiPage<T> => {
  return !!data
    && typeof data === 'object'
    && Array.isArray((data as any).content)
    && typeof (data as any).totalElements === 'number';
};

/** Lấy thẳng data (single hoặc list) từ ApiResponse */
export function unwrapData<T>(resp: ApiResponse<T>): T {
  return resp.data;
}

/**
 * Chuyển ApiPagedResponse<T> thành dạng nhẹ nhàng để bind UI (items + meta).
 * Dùng cho service khi muốn trả về { items, total, page, size, totalPages, first, last }.
 */
export function toPagedResult<T>(resp: ApiPagedResponse<T>) {
  const p = resp.data;
  return {
    items: p?.content ?? [],
    total: p?.totalElements ?? 0,
    page: p?.number ?? 0,
    size: p?.size ?? p?.pageable?.pageSize ?? 0,
    totalPages: p?.totalPages ?? 0,
    first: !!p?.first,
    last: !!p?.last
  };
}
