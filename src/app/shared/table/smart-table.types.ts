import { TemplateRef } from '@angular/core';

export interface SmartTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  templateRef?: TemplateRef<any> | null;
  /** kiểu hiển thị (mặc định text) */
  type?: 'text' | 'number' | 'date';
}

export interface SmartTableAction<T> {
  icon: string;
  tooltip?: string;
  color?: string;
  visible?: (row: T) => boolean;
  handler: (row: T) => void;
}

export interface TableQuery {
  page: number;
  size: number;
  sort?: string;
  order?: 'asc' | 'desc';
  /** thêm keyword để dùng cho bộ lọc */
  keyword?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}


export type SortOrder = 'asc' | 'desc';
