// src/app/admin/services/ticket-point.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {TicketPoint} from '../../admin/models/ticket-point.model';

@Injectable({ providedIn: 'root' })
export class TicketPointService {

  constructor(private api: ApiService) {}

  list(): Observable<TicketPoint[]> {
    return this.api.get<TicketPoint[]>('/admin/points');
  }

  create(payload: TicketPoint): Observable<TicketPoint> {
    return this.api.post<TicketPoint>('/admin/points', payload);
  }

  update(id: number, payload: TicketPoint): Observable<TicketPoint> {
    return this.api.put<TicketPoint>(`/admin/points/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/admin/points/${id}`);
  }
}
