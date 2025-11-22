// src/app/app.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';           // <-- cần cho *ngIf / else
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';

// chỉnh đường dẫn cho đúng dự án của bạn
import { HeaderComponent } from './layout/header/header.component';
import { ChatboxComponent } from './features/chatbox/chatbox.component';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet, HeaderComponent, ChatboxComponent] // <-- thêm ở đây
})
export class AppComponent implements OnDestroy {
  isAdmin = false;
  private sub?: Subscription;

  constructor(private router: Router) {
    this.isAdmin = this.checkAdmin(router.url);
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
        this.isAdmin = this.checkAdmin(url);
      });
  }

  private checkAdmin(url: string): boolean {
    return url.startsWith('/admin') || url.startsWith('/login');
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
