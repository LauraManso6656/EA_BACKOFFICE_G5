import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService, AdminLog } from '../../services/audit-service';
import { UsuarioService } from '../../services/usuario-service';
import { Navbar } from '../navbar/navbar';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [CommonModule, Navbar, RouterModule, ReactiveFormsModule],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.css',
})
export class AuditList implements OnInit {
  private auditService = inject(AuditService);
  private usuarioService = inject(UsuarioService);

  logs = signal<AdminLog[]>([]);
  totalLogs = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  loading = signal(true);

  // Filters
  searchControl = new FormControl('');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');
  actionControl = new FormControl('');
  adminControl = new FormControl('');

  admins = signal<any[]>([]);
  actions = [
    'UPDATE_REPORT',
    'DELETE_REPORT',
    'DELETE_POST',
    'DELETE_COMMENT',
    'CHANGE_ROLE',
    'BAN_USER',
    'UPDATE_USER',
  ];

  ngOnInit(): void {
    this.loadLogs();
    this.loadAdmins();
    this.setupFilters();
  }

  setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.resetAndLoad());

    this.startDateControl.valueChanges.subscribe(() => this.resetAndLoad());
    this.endDateControl.valueChanges.subscribe(() => this.resetAndLoad());
    this.actionControl.valueChanges.subscribe(() => this.resetAndLoad());
    this.adminControl.valueChanges.subscribe(() => this.resetAndLoad());
  }

  loadAdmins(): void {
    // Buscamos usuarios con rol admin
    this.usuarioService.getUsuarios(1, 100, '').subscribe((res) => {
      this.admins.set(res.docs.filter((u: any) => u.rol === 'admin'));
    });
  }

  resetAndLoad(): void {
    this.currentPage.set(1);
    this.loadLogs(1);
  }

  loadLogs(page: number = 1): void {
    this.loading.set(true);

    const filters = {
      search: this.searchControl.value,
      startDate: this.startDateControl.value,
      endDate: this.endDateControl.value,
      accion: this.actionControl.value,
      adminId: this.adminControl.value,
    };

    this.auditService.getLogs(page, 20, filters).subscribe({
      next: (res) => {
        this.logs.set(res.docs);
        this.totalLogs.set(res.totalDocs);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading logs:', err);
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.loadLogs(this.currentPage());
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.loadLogs(page);
    }
  }

  getActionLabel(action: string): string {
    return action.replace(/_/g, ' ');
  }

  getActionClass(action: string): string {
    if (action.includes('DELETE')) return 'bg-error/10 text-error border-error/20';
    if (action.includes('UPDATE') || action.includes('CHANGE'))
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (action.includes('BAN')) return 'bg-error text-white';
    return 'bg-secondary/10 text-secondary border-secondary/20';
  }

  getTargetIcon(type: string): string {
    switch (type) {
      case 'report':
        return 'flag';
      case 'post':
        return 'image';
      case 'comment':
        return 'chat_bubble';
      case 'user':
        return 'person';
      default:
        return 'settings';
    }
  }
}
