import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../services/session-service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="sessionService.isVisible()"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      [@backdropAnimate]
    >
      <div
        class="bg-primary-container border border-outline-variant/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
        [@modalAnimate]
      >
        <div class="flex flex-col items-center text-center">
          <div class="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-4xl text-secondary animate-bounce"
              >timer</span
            >
          </div>

          <h2 class="text-2xl font-bold text-white mb-2">Session Expiring</h2>
          <p class="text-on-surface-variant mb-8">
            Your secure session is about to expire for security reasons. Would you like to stay
            connected or logout now?
          </p>

          <div class="flex flex-col w-full gap-3">
            <button
              (click)="sessionService.extendSession()"
              class="w-full bg-secondary text-primary-container font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-secondary/20 uppercase tracking-widest text-sm"
            >
              Keep me signed in
            </button>

            <button
              (click)="sessionService.logout()"
              class="w-full bg-surface-container-highest text-white font-bold py-4 rounded-2xl hover:bg-surface-container/80 transition-all uppercase tracking-widest text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('backdropAnimate', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('modalAnimate', [
      transition(':enter', [
        style({ transform: 'scale(0.9) translateY(20px)', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ transform: 'scale(1) translateY(0)', opacity: 1 }),
        ),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'scale(0.9) opacity: 0' })),
      ]),
    ]),
  ],
})
export class SessionModal {
  sessionService = inject(SessionService);
}
