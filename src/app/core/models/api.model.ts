// src/app/core/models/api.model.ts
export interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
  total?: number;
  page?: number;
  size?: number;
  [key: string]: any;
}
