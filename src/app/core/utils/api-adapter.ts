// src/app/core/utils/api-adapter.ts
import {
  ApiResponse, ApiListResponse, ApiPagedResponse, ApiPage, isApiPage
} from '../models/api.model';
import { PagedResult } from '../models/paging.model';

export function toPagedResultFromAny<T>(value: any): PagedResult<T> {
  // Đã là PagedResult
  if (value && typeof value === 'object' && Array.isArray(value.items) && typeof value.total === 'number') {
    return value as PagedResult<T>;
  }

  // Envelope chuẩn
  if (value && typeof value === 'object' && 'data' in value) {
    const d = (value as ApiResponse<any>).data;
    // Paged (data.content)
    if (isApiPage<T>(d)) {
      const p = d as ApiPage<T>;
      return {
        items: p.content ?? [],
        total: p.totalElements ?? 0,
        page: p.number ?? 0,
        size: p.size ?? p.pageable?.pageSize ?? (p.content?.length ?? 0),
        totalPages: p.totalPages ?? 1,
        first: !!p.first,
        last: !!p.last
      };
    }
    // List (data là array)
    if (Array.isArray(d)) {
      return {
        items: d as T[],
        total: d.length,
        page: 0,
        size: d.length,
        totalPages: 1
      };
    }
    // Single object
    return {
      items: d ? [d as T] : [],
      total: d ? 1 : 0,
      page: 0,
      size: d ? 1 : 0,
      totalPages: 1
    };
  }

  // Thuần mảng (trường hợp đặc biệt)
  if (Array.isArray(value)) {
    return { items: value as T[], total: value.length, page: 0, size: value.length, totalPages: 1 };
  }

  throw new Error('Unsupported response shape to normalize to PagedResult');
}
