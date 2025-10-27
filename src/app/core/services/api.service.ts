// src/app/core/services/api.service.ts (Corrected)

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
// *** No longer need to import AuthService here ***
// import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // *** No longer need to inject AuthService here ***
  // private authService = inject(AuthService);

  private readonly apiUrl = environment.apiUrl;

  /**
   * === UPDATED HELPER: Creates Authorization Headers ===
   * Gets the token directly from localStorage.
   * Returns null if no token is found.
   */
  private getAuthHeaders(): HttpHeaders | null {
    // *** CHANGE: Get token directly from localStorage ***
    const token = localStorage.getItem('authToken'); // Assumes 'authToken' is the key used by AuthService
    if (!token) {
      return null;
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * GET request - Automatically adds Auth Header if token exists
   */
  get<T>(
    endpoint: string,
    params?: HttpParams | { [param: string]: string | string[] },
  ): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = this.getAuthHeaders();
    const requestOptions = { params, headers: headers ?? undefined };
    return this.http.get<T>(url, requestOptions).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST request - Automatically adds Auth Header if token exists
   */
  post<T>(endpoint: string, data: unknown): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = this.getAuthHeaders();
    const requestOptions = { headers: headers ?? undefined };
    return this.http.post<T>(url, data, requestOptions).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PUT request - Automatically adds Auth Header if token exists
   */
  put<T>(endpoint: string, data: unknown): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = this.getAuthHeaders();
    const requestOptions = { headers: headers ?? undefined };
    return this.http.put<T>(url, data, requestOptions).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE request - Automatically adds Auth Header if token exists
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = this.getAuthHeaders();
    const requestOptions = { headers: headers ?? undefined };
    return this.http.delete<T>(url, requestOptions).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Common error handler
   */
  private handleError(error: HttpErrorResponse) {
    // You might add more sophisticated error logging/handling here
    console.error('API Error:', error);
    return throwError(() => error); // Forward the error
  }
}
