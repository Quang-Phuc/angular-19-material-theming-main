import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { UiService } from '../../core/services/ui.service';
import { ScrollArrowsDirective } from '../../shared/directives/scroll-arrows.directive';
import { DrawerComponent } from '../drawer/drawer.component';
import { filter } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, RouterLink, ScrollArrowsDirective, DrawerComponent]
})
export class HeaderComponent {
  private router = inject(Router);
  public ui = inject(UiService);

  moreOpen = false;
  currentRegion: 'mb' | 'mn' | 'mt' | 'vietlott' = 'mb';

  ribbonItems = [
    { tag: 'XSMB',      icon:'📍', title:'Điểm Mua Vé Số',        sub:'Tìm đại lý gần bạn',   link:'/diem-mua-ve-so' },
    { tag: 'AI',        icon:'💭', title:'Đoán Số Giấc Mơ',       badge:32, sub:'Từ điển + thống kê', link:'/giac-mo' },
    { tag: 'AI',        icon:'💡', title:'Dự Đoán Xổ Số Bằng AI', badge:17, sub:'Gợi ý nóng hôm nay', link:'/ai' },
    { tag: '00 → 99',   icon:'🪄', title:'Lọc Số Sáng Nhất',      badge:79, sub:'Theo ngày/tuần',     link:'/loc-so' },
  ];

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects;
      if (url.includes('vietlott')) this.currentRegion = 'vietlott';
      else if (url.includes('xsmn') || url.includes('mn')) this.currentRegion = 'mn';
      else if (url.includes('xsmt') || url.includes('mt')) this.currentRegion = 'mt';
      else this.currentRegion = 'mb';
    });
  }

  isActiveTab(region: 'mb' | 'mn' | 'mt' | 'vietlott'): boolean {
    return this.currentRegion === region;
  }

  toggleMore() { this.moreOpen = !this.moreOpen; }

  @HostListener('document:click', ['$event'])
  onClick(e: MouseEvent) {
    if (!(e.target as HTMLElement)?.closest('.more-wrap')) this.moreOpen = false;
  }

  setActiveDay(el: HTMLElement) {
    const parent = el.parentElement;
    if (!parent) return;
    parent.querySelectorAll('.day').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
  }
}
