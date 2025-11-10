// src/app/core/models/paging.model.ts
export interface TableQuery {
  page: number;           // 0-based
  size: number;
  sort?: string;          // field
  order?: 'asc' | 'desc'; // thứ tự
  keyword?: string;
  filters?: Record<string, any>;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
}
