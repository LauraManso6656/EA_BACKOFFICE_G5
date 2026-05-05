import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../services/confirm-service';

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

  constructor(private confirmService: ConfirmService) {}

  ngOnInit(): void {
    this.confirmService.confirm$.subscribe(opt => {
      this.options = opt;
      this.isProcessing = false;
    });
  }

  cancel(): void {
    this.confirmService.close();
  }

  confirm(): void {
    if (this.options?.onConfirm) {
      this.isProcessing = true;
      this.options.onConfirm();
    }
    // We don't close immediately if it's processing, but the services usually handle the close
    // For now, let's keep it simple as the previous modals did.
    // Actually, the previous modal had a "Deleting..." state.
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
