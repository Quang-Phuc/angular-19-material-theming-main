import { Injectable } from '@angular/core';

interface Entry<T> { value: T; expireAt?: number; }

@Injectable({ providedIn: 'root' })
export class CacheService {
  private map = new Map<string, Entry<any>>();

  set<T>(key: string, value: T, ttlMs?: number) {
    const entry: Entry<T> = { value };
    if (ttlMs && ttlMs > 0) entry.expireAt = Date.now() + ttlMs;
    this.map.set(key, entry);
  }

  get<T>(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expireAt && e.expireAt < Date.now()) { this.map.delete(key); return undefined; }
    return e.value as T;
  }

  has(key: string) { return this.get(key) !== undefined; }
  delete(key: string) { this.map.delete(key); }
  clear() { this.map.clear(); }
}
