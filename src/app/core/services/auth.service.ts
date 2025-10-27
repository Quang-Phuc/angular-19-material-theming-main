// core/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service'; // Assumes ApiService is in the same core/services folder

// Interfaces
export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  roles: string[];
}

export interface LoginPayload {
  phone: string;
  password?: string;
  type: 'USER' | 'ADMIN';
}

// *** 1. Ensure RegisterPayload is EXPORTED ***
export interface RegisterPayload {
  storeName: string | null;
  phone: string | null;
  password: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private router = inject(Router);
  private apiService = inject(ApiService);

  // --- Auth Data Management ---
  saveAuthData(response: AuthResponse): void {
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('userRoles', JSON.stringify(response.roles));
  }

  getUserRoles(): string[] {
    const rolesString = localStorage.getItem('userRoles');
    if (rolesString) {
      try {
        return JSON.parse(rolesString) as string[];
      } catch (e) {
        console.error('Error parsing user roles from localStorage', e);
        return [];
      }
    }
    return [];
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRoles');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // --- API Calls ---

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', payload);
  }

  // *** 2. Ensure the register method EXISTS ***
  register(payload: RegisterPayload): Observable<any> { // Returns Observable<any> for now
    return this.apiService.post<any>('/auth/register', payload);
  }
}
