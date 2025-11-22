// src/app/admin/services/vietlott.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {VietlottResult} from '../../admin/models/vietlott-result.model';

@Injectable({ providedIn: 'root' })
export class VietlottService {
  constructor(private api: ApiService) {}

  list(): Observable<VietlottResult[]> {
    return this.api.get<VietlottResult[]>('/admin/vietlott');
  }

  create(payload: VietlottResult): Observable<VietlottResult> {
    return this.api.post<VietlottResult>('/admin/vietlott', payload);
  }

  update(id: number, payload: VietlottResult): Observable<VietlottResult> {
    return this.api.put<VietlottResult>(`/admin/vietlott/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/vietlott/${id}`);
  }
}
