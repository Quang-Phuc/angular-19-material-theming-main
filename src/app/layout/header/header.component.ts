import { Component, ElementRef, ViewChild, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
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

  setActiveDay(el: HTMLElement) {
    const parent = el.parentElement;
    if (!parent) return;
    parent.querySelectorAll('.day').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const t = e.target as HTMLElement | null;
    if (!t?.closest('.more-wrap')) this.moreOpen = false;
  }
}
