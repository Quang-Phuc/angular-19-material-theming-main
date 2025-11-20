// src/app/features/past-days/past-days.component.ts
import { Component } from '@angular/core';
@Component({
  standalone: true,
  selector: 'app-past-days',
  template: `<section class="card">3 ngày gần nhất (demo)</section>`,
  styles: [`.card{padding:12px;border:1px solid #333;border-radius:8px;margin:12px 0}`]
})
export class PastDaysComponent {}
