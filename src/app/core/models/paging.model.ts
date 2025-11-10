// src/app/core/models/paging.model.ts
export type SortOrder = 'asc' | 'desc';

export interface TableQuery {
  page: number;          // 0-based
  size: number;          // pageSize
  sort?: string;         // sort field
  order?: SortOrder;     // 'asc' | 'desc'
  keyword?: string;      // optional keyword
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
