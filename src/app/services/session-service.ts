import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  // Signal para controlar la visibilidad del modal
  isVisible = signal(false);

  // Subject para emitir la decisión del usuario (true = extender, false = logout)
  private sessionDecision = new Subject<boolean>();
  sessionDecision$ = this.sessionDecision.asObservable();

  showSessionModal(): void {
    if (!this.isVisible()) {
      this.isVisible.set(true);
    }
  }

  hideSessionModal(): void {
    this.isVisible.set(false);
  }

  extendSession(): void {
    this.sessionDecision.next(true);
    this.hideSessionModal();
  }

  logout(): void {
    this.sessionDecision.next(false);
    this.hideSessionModal();
  }
}
