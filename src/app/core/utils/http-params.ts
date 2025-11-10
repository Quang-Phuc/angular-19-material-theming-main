import { HttpParams } from '@angular/common/http';

export function toHttpParams(p?: Record<string, any> | HttpParams): HttpParams {
  if (p instanceof HttpParams) return p;
  const o: Record<string, string> = {};
  Object.entries(p ?? {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof Date) o[k] = v.toISOString();
    else o[k] = String(v);
  });
  return new HttpParams({ fromObject: o });
}

/** Hỗ trợ build params từ TableQuery và filters khác */
export function buildQueryParams(q: {
  page?: number; size?: number; sort?: string; order?: 'asc'|'desc'; keyword?: string;
  [k: string]: any;
}) {
  const { page, size, sort, order, keyword, ...rest } = q || {};
  const params: any = { ...rest };
  if (page != null) params.page = page;
  if (size != null) params.size = size;
  if (sort) params.sort = sort;
  if (order) params.order = order;
  if (keyword) params.keyword = keyword;
  return params;
}
