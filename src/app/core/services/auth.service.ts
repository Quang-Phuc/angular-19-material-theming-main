import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private KEY = 'admin_logged';
  isLoggedIn(): boolean { return localStorage.getItem(this.KEY) === 'true'; }
  loginHardcode(u: string, p: string): boolean {
    const ok = (u === 'admin' && p === '12345678aA@');
    if (ok) localStorage.setItem(this.KEY, 'true');
    return ok;
  }
  logout(): void { localStorage.removeItem(this.KEY); }
}
