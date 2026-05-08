import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../services/confirm-service';
import { isObservable } from 'rxjs';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css'
})
export class ConfirmModal implements OnInit {
  options: ConfirmOptions | null = null;
  isProcessing = false;

  constructor(
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.confirmService.confirm$.subscribe(opt => {
      this.options = opt;
      this.isProcessing = false;
      this.cdr.detectChanges();
    });
  }

  cancel(): void {
    if (this.isProcessing) return;
    this.confirmService.close();
  }

  confirm(): void {
    if (!this.options?.onConfirm || this.isProcessing) return;

    this.isProcessing = true;
    const result = this.options.onConfirm();

    if (result instanceof Promise) {
      result
        .then(() => {
          this.confirmService.close();
          this.cdr.detectChanges();
        })
        .catch(() => {
          this.isProcessing = false;
          this.cdr.detectChanges();
        });
    } else if (isObservable(result)) {
      result.subscribe({
        next: () => {
          this.confirmService.close();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isProcessing = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          this.confirmService.close();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.confirmService.close();
      this.cdr.detectChanges();
    }
  }

  getIcon(): string {
    if (this.options?.type === 'post') return 'warning';
    if (this.options?.type === 'comment') return 'chat_error';
    
    switch (this.options?.type) {
      case 'danger': return 'delete';
      case 'warning': return 'warning';
      default: return 'help';
    }
  }
}
