// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

type RespType = 'json' | 'blob' | 'text';
export interface ApiRequestOptions {
  params?: Record<string, any> | HttpParams;
  headers?: Record<string, string> | HttpHeaders;
  responseType?: RespType;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private toHttpParams(p?: Record<string, any> | HttpParams): HttpParams {
    if (p instanceof HttpParams) return p;
    const o: Record<string, string> = {};
    Object.entries(p ?? {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      o[k] = String(v);
    });
    return new HttpParams({ fromObject: o });
  }

  private toHttpHeaders(h?: Record<string, string> | HttpHeaders): HttpHeaders {
    if (h instanceof HttpHeaders) return h;
    return new HttpHeaders(h ?? {});
  }

  /** Ghép base URL nếu url là đường dẫn tương đối */
  private resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;         // đã là absolute
    const base = (environment.apiUrl || '').replace(/\/+$/, '');
    const path = (url || '').replace(/^\/+/, '');
    return `${base}/${path}`;                           // base/path
  }

  get<T>(url: string, options: ApiRequestOptions | HttpParams = {} as any): Observable<T> {
    const fullUrl = this.resolveUrl(url);
    let params: HttpParams, headers: HttpHeaders, responseType: RespType = 'json';
    if (options instanceof HttpParams) {
      params = options; headers = new HttpHeaders({});
    } else {
      params = this.toHttpParams(options.params);
      headers = this.toHttpHeaders(options.headers);
      responseType = options.responseType ?? 'json';
    }

    switch (responseType) {
      case 'blob':
        return this.http.get(fullUrl, { params, headers, responseType: 'blob' })
          .pipe(map(res => res as unknown as T));
      case 'text':
        return this.http.get(fullUrl, { params, headers, responseType: 'text' })
          .pipe(map(res => res as unknown as T));
      default:
        return this.http.get<T>(fullUrl, { params, headers, responseType: 'json' });
    }
  }

  post<T>(url: string, body?: any, options: ApiRequestOptions = {}): Observable<T> {
    const fullUrl = this.resolveUrl(url);
    const params = this.toHttpParams(options.params);
    const headers = this.toHttpHeaders(options.headers);
    const responseType = options.responseType ?? 'json';

    switch (responseType) {
      case 'blob':
        return this.http.post(fullUrl, body ?? {}, { params, headers, responseType: 'blob' })
          .pipe(map(res => res as unknown as T));
      case 'text':
        return this.http.post(fullUrl, body ?? {}, { params, headers, responseType: 'text' })
          .pipe(map(res => res as unknown as T));
      default:
        // ✅ Nếu body là FormData → KHÔNG set Content-Type, để Angular tự thêm boundary
        const isFormData = body instanceof FormData;
        const finalHeaders = isFormData
          ? headers
          : headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

        return this.http.post<T>(fullUrl, body ?? {}, { params, headers: finalHeaders, responseType: 'json' });
    }
  }


  put<T>(url: string, body?: any, options: ApiRequestOptions = {}): Observable<T> {
    const fullUrl = this.resolveUrl(url);
    const params = this.toHttpParams(options.params);
    const headers = this.toHttpHeaders(options.headers);
    const responseType = options.responseType ?? 'json';

    switch (responseType) {
      case 'blob':
        return this.http.put(fullUrl, body ?? {}, { params, headers, responseType: 'blob' })
          .pipe(map(res => res as unknown as T));

      case 'text':
        return this.http.put(fullUrl, body ?? {}, { params, headers, responseType: 'text' })
          .pipe(map(res => res as unknown as T));

      default:
        // ✅ Nếu là FormData thì KHÔNG set Content-Type (Angular sẽ tự thêm boundary)
        const isFormData = body instanceof FormData;
        const finalHeaders = isFormData
          ? headers
          : headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

        return this.http.put<T>(fullUrl, body ?? {}, {
          params,
          headers: finalHeaders,
          responseType: 'json'
        });
    }
  }


  delete<T>(url: string, options: ApiRequestOptions | HttpParams = {} as any): Observable<T> {
    const fullUrl = this.resolveUrl(url);
    let params: HttpParams, headers: HttpHeaders, responseType: RespType = 'json';
    if (options instanceof HttpParams) {
      params = options; headers = new HttpHeaders({});
    } else {
      params = this.toHttpParams(options.params);
      headers = this.toHttpHeaders(options.headers);
      responseType = options.responseType ?? 'json';
    }

    switch (responseType) {
      case 'blob':
        return this.http.delete(fullUrl, { params, headers, responseType: 'blob' })
          .pipe(map(res => res as unknown as T));
      case 'text':
        return this.http.delete(fullUrl, { params, headers, responseType: 'text' })
          .pipe(map(res => res as unknown as T));
      default:
        return this.http.delete<T>(fullUrl, { params, headers, responseType: 'json' });
    }
  }

  download(url: string, params?: Record<string, any> | HttpParams): Observable<Blob> {
    const fullUrl = this.resolveUrl(url);
    const p = this.toHttpParams(params);
    return this.http.get(fullUrl, { params: p, responseType: 'blob' });
  }

  upload<T>(url: string, formData: FormData, options: ApiRequestOptions = {}): Observable<T> {
    const fullUrl = this.resolveUrl(url);
    const params = this.toHttpParams(options.params);
    const headers = this.toHttpHeaders(options.headers);
    return this.http.post<T>(fullUrl, formData, { params, headers, responseType: 'json' });
  }
}
