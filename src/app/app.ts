import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmModal } from './components/confirm-modal/confirm-modal';
import { PostDetailModal } from './components/post-detail-modal/post-detail-modal';
import { SessionModal } from './components/session-modal/session-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmModal, PostDetailModal, SessionModal],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('EA_BACKOFFICE_G5');
}
