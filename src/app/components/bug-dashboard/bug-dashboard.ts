import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BugService } from '../../services/bug-service';
import { BugReport } from '../../models/bug';
import { Navbar } from '../navbar/navbar';
import { ConfirmService } from '../../services/confirm-service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-bug-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './bug-dashboard.html',
  styleUrl: './bug-dashboard.css',
})
export class BugDashboard implements OnInit {
  bugs: BugReport[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalDocs = 0;

  // Filters
  estadoFilter: 'all' | 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado' = 'all';
  plataformaFilter: 'all' | 'web' | 'app' | 'otro' = 'all';
  showOnlyActive = true;
  isUpdating = false;
  loading = false;

  private platformId = inject(PLATFORM_ID);
  private confirmService = inject(ConfirmService);

  constructor(
    private bugService: BugService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  load(): void {
    this.loading = true;
    this.bugService
      .getBugs(
        this.currentPage,
        this.pageSize,
        this.estadoFilter,
        this.plataformaFilter,
        this.showOnlyActive,
      )
      .subscribe({
        next: (res) => {
          this.bugs = res.docs;
          this.totalPages = res.totalPages;
          this.totalDocs = res.totalDocs || 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading bugs:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  filterBugs(): void {
    this.currentPage = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.load();
    }
  }

  toggleActiveFilter(): void {
    this.showOnlyActive = !this.showOnlyActive;
    if (
      this.showOnlyActive &&
      (this.estadoFilter === 'resuelto' || this.estadoFilter === 'rechazado')
    ) {
      this.estadoFilter = 'all'; // Reset status if active only is turned on and we were viewing resolved/rejected
    }
    this.filterBugs();
  }

  setEstadoFilter(estado: 'all' | 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado'): void {
    this.estadoFilter = estado;
    if (estado === 'resuelto' || estado === 'rechazado') {
      this.showOnlyActive = false; // Turn off active only if they explicitly want to see resolved/rejected
    }
    this.filterBugs();
  }

  setPlataformaFilter(plataforma: 'all' | 'web' | 'app' | 'otro'): void {
    this.plataformaFilter = plataforma;
    this.filterBugs();
  }

  updateStatus(bug: BugReport, newStatus: string): void {
    this.isUpdating = true;
    const existingReporter = bug.usuarioReporta;

    this.bugService.updateBugStatus(bug._id, newStatus).subscribe({
      next: (updated) => {
        if (typeof updated.usuarioReporta === 'string' && typeof existingReporter !== 'string') {
          updated.usuarioReporta = existingReporter;
        }

        const index = this.bugs.findIndex((b) => b._id === updated._id);
        if (index !== -1) this.bugs[index] = updated;
        this.isUpdating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.isUpdating = false;
      },
    });
  }

  openDeleteModal(bug: BugReport): void {
    this.confirmService.ask({
      title: 'Delete Bug Report?',
      message: `Are you sure you want to delete this bug report? This action is permanent.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        return this.bugService.deleteBug(bug._id).pipe(
          tap(() => {
            this.bugs = this.bugs.filter((b) => b._id !== bug._id);
            this.filterBugs();
          }),
        );
      },
    });
  }

  getInitials(name: any): string {
    if (typeof name !== 'string') return '??';
    return name.substring(0, 2).toUpperCase();
  }

  getAuthorName(bug: BugReport): string {
    if (!bug.usuarioReporta) return 'System';
    if (typeof bug.usuarioReporta === 'string') return 'Anonymous';
    return bug.usuarioReporta.nombre || 'Unknown';
  }
}
