import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  get<T = any>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw == null) return null;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  }
  set(key: string, value: any): void {
    if (value === undefined) return;
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, raw);
  }
  remove(key: string): void { localStorage.removeItem(key); }
  clear(): void { localStorage.clear(); }
}
