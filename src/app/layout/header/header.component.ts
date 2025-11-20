import { Component, ElementRef, ViewChild, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiService } from '../../core/services/ui.service';
import { ScrollArrowsDirective } from '../../shared/directives/scroll-arrows.directive';
import { DrawerComponent } from '../drawer/drawer.component';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, RouterLink, ScrollArrowsDirective, DrawerComponent]
})
export class HeaderComponent {
  @ViewChild('regionStrip') regionStrip!: ElementRef<HTMLElement>;
  @ViewChild('daysStrip')   daysStrip!: ElementRef<HTMLElement>;

  public ui = inject(UiService);

  moreOpen = false;
  toggleMore(){ this.moreOpen = !this.moreOpen; }
  closeMore(){ this.moreOpen = false; }

  // dữ liệu cho Gold Ribbon
  ribbonItems = [
    { tag: 'XSMB',      icon:'📍', title:'Điểm Mua Vé Số',        sub:'Tìm đại lý gần bạn',   link:'/mua-ve' },
    { tag: 'AI',        icon:'💭', title:'Đoán Số Giấc Mơ',       badge:32, sub:'Từ điển + thống kê', link:'/giac-mo' },
    { tag: 'AI',        icon:'💡', title:'Dự Đoán Xổ Số Bằng AI', badge:17, sub:'Gợi ý nóng hôm nay', link:'/ai' },
    { tag: '00 → 99',   icon:'🪄', title:'Lọc Số Sáng Nhất',      badge:79, sub:'Theo ngày/tuần',     link:'/loc-so' },
    { tag: 'Phong Thuỷ',icon:'🧭', title:'Số Phong Thuỷ',         badge:35, sub:'Mạng & tuổi',        link:'/phong-thuy' },
  ];

  // set active cho dải thứ/ngày (truyền thẳng element ref)
  setActiveDay(el: HTMLElement) {
    const parent = el.parentElement; if (!parent) return;
    parent.querySelectorAll('.day').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement | null;
    if (!t?.closest('.more-wrap')) this.moreOpen = false;
  }
}
