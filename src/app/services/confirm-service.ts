import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'post' | 'comment';
  onConfirm: () => void | Promise<any> | Observable<any>;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  private confirmSubject = new Subject<ConfirmOptions | null>();
  confirm$ = this.confirmSubject.asObservable();

  constructor() {}

  /**
   * Abre un modal de confirmación.
   * @param options Configuración del modal y callback de confirmación
   */
  ask(options: ConfirmOptions): void {
    this.confirmSubject.next(options);
  }

  close(): void {
    this.confirmSubject.next(null);
  }
}
