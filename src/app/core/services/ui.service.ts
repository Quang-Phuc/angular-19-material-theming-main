// src/app/core/services/ui.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  drawer$ = new BehaviorSubject<boolean>(false);
  chat$   = new BehaviorSubject<boolean>(false);

  openDrawer() { this.drawer$.next(true); }
  closeDrawer() { this.drawer$.next(false); }
  toggleDrawer(){ this.drawer$.next(!this.drawer$.value); }

  openChat() { this.chat$.next(true); }
  closeChat(){ this.chat$.next(false); }
  toggleChat(){ this.chat$.next(!this.chat$.value); }
}
