// src/app/shared/directives/scroll-arrows.directive.ts
import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({standalone: true, selector: '[scrollArrows]'})
export class ScrollArrowsDirective implements AfterViewInit {
  @Input() leftBtn?: HTMLElement;
  @Input() rightBtn?: HTMLElement;
  @Input() step = 220;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit() {
    const el = this.host.nativeElement;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth - 1;
      if (this.leftBtn)  this.leftBtn.style.opacity  = el.scrollLeft > 0 ? '1' : '.35';
      if (this.rightBtn) this.rightBtn.style.opacity = el.scrollLeft < max ? '1' : '.35';
    };
    this.leftBtn?.addEventListener('click', () => { el.scrollBy({left: -this.step, behavior:'smooth'}); setTimeout(update, 300); });
    this.rightBtn?.addEventListener('click', () => { el.scrollBy({left:  this.step, behavior:'smooth'}); setTimeout(update, 300); });
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  }
}
