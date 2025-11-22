// src/app/admin/services/lottery-admin.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {LotteryDraw} from '../../admin/models/lottery-draw.model';

@Injectable({ providedIn: 'root' })
export class LotteryAdminService {
  constructor(private api: ApiService) {}

  list(): Observable<LotteryDraw[]> {
    return this.api.get<LotteryDraw[]>('/admin/lottery');
  }

  create(payload: LotteryDraw): Observable<LotteryDraw> {
    return this.api.post<LotteryDraw>('/admin/lottery', payload);
  }

  update(id: number, payload: LotteryDraw): Observable<LotteryDraw> {
    return this.api.put<LotteryDraw>(`/admin/lottery/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/lottery/${id}`);
  }
}
