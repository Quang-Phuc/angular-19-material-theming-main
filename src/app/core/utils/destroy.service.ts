import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/** DI service để có sẵn destroyed$ cho takeUntil trong component/service */
@Injectable()
export class DestroyService implements OnDestroy {
  readonly destroyed$ = new Subject<void>();
  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
