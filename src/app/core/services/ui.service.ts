import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  // trạng thái Drawer và Chat (BehaviorSubject để template async pipe dùng được)
  drawer$ = new BehaviorSubject<boolean>(false);
  chat$   = new BehaviorSubject<boolean>(false);

  toggleDrawer(){ this.drawer$.next(!this.drawer$.value); }
  closeDrawer(){ this.drawer$.next(false); }

  toggleChat(){ this.chat$.next(!this.chat$.value); }
  closeChat(){ this.chat$.next(false); }
}
