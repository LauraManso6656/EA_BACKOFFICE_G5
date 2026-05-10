import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { ReportService } from '../../services/report-service';
import { StatsService, ReportStats } from '../../services/stats-service';
import { Report } from '../../models/report';
import { Navbar } from '../navbar/navbar';
import { ConfirmService } from '../../services/confirm-service';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Navbar],
  templateUrl: './report-dashboard.html',
  styleUrl: './report-dashboard.css'
})
export class ReportDashboard implements OnInit {
  reports: Report[] = [];
  filteredReports: Report[] = [];
  visibleReports: Report[] = [];
  
  // Stats
  reportStats: ReportStats = {
    total: 0,
    user: 0,
    post: 0,
    comment: 0,
    chat: 0
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalDocs = 0;

  // Filters
  searchControl = new FormControl('');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');
  tipoFilter: 'all' | 'user' | 'post' | 'comment' | 'chat' = 'all';
  estadoFilter: 'all' | 'pendiente' | 'revisado' | 'resuelto' = 'all';
  showOnlyActive = true;
  isUpdating = false;
  loading = false;

  private platformId = inject(PLATFORM_ID);
  private confirmService = inject(ConfirmService);

  constructor(
    private reportService: ReportService,
    private statsService: StatsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
      
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => this.filterReports());
      this.startDateControl.valueChanges.subscribe(() => this.filterReports());
      this.endDateControl.valueChanges.subscribe(() => this.filterReports());
    }
  }

  load(): void {
    this.loadReports();
    this.loadStats();
  }

  loadReports(): void {
    this.loading = true;
    const search = this.searchControl.value ?? '';
    const startDate = this.startDateControl.value ?? '';
    const endDate = this.endDateControl.value ?? '';

    this.reportService.getReports(
      this.currentPage, 
      this.pageSize,
      search,
      this.tipoFilter,
      this.showOnlyActive,
      startDate,
      endDate,
      this.estadoFilter
    ).subscribe({
      next: (res) => {
        this.reports = res.docs;
        this.totalPages = res.totalPages;
        this.totalDocs = res.totalDocs || 0;
        this.visibleReports = this.reports;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStats(): void {
    this.statsService.getReportStats().subscribe({
      next: (data) => {
        this.reportStats = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading report stats:', err)
    });
  }

  filterReports(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  toggleActiveFilter(): void {
    this.showOnlyActive = !this.showOnlyActive;
    if (this.showOnlyActive && this.estadoFilter === 'resuelto') {
      this.estadoFilter = 'all'; // Reset status if active only is turned on and we were viewing resolved
    }
    this.filterReports();
  }

  setEstadoFilter(estado: 'all' | 'pendiente' | 'revisado' | 'resuelto'): void {
    this.estadoFilter = estado;
    if (estado === 'resuelto') {
      this.showOnlyActive = false; // Turn off active only if they explicitly want to see resolved
    }
    this.filterReports();
  }

  updateVisibleReports(): void {
    this.visibleReports = this.reports;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReports();
    }
  }

  setTipoFilter(tipo: 'all' | 'user' | 'post' | 'comment' | 'chat'): void {
    this.tipoFilter = tipo;
    this.filterReports();
  }

  updateStatus(report: Report, newStatus: string): void {
    this.isUpdating = true;
    const existingReporter = report.usuarioReporta;

    this.reportService.updateReportStatus(report._id, newStatus).subscribe({
      next: (updated) => {
        // Restaurar reportero si el backend no lo 'puebla'
        if (typeof updated.usuarioReporta === 'string' && typeof existingReporter !== 'string') {
          updated.usuarioReporta = existingReporter;
        }

        const index = this.reports.findIndex(r => r._id === updated._id);
        if (index !== -1) this.reports[index] = updated;
        this.filterReports();
        this.loadStats();
        this.isUpdating = false;
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.isUpdating = false;
      }
    });
  }

  openDeleteModal(report: Report): void {
    this.confirmService.ask({
      title: 'Delete Report?',
      message: `Are you sure you want to delete this report? This action is permanent.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        return this.reportService.deleteReport(report._id).pipe(
          tap(() => {
            this.reports = this.reports.filter(r => r._id !== report._id);
            this.filterReports();
            this.loadStats();
          })
        );
      }
    });
  }

  getInitials(name: any): string {
    if (typeof name !== 'string') return '??';
    return name.substring(0, 2).toUpperCase();
  }

  getAuthorName(report: Report): string {
    if (!report.usuarioReporta) return 'System';
    if (typeof report.usuarioReporta === 'string') return 'Anonymous';
    return report.usuarioReporta.nombre || 'Unknown';
  }
}
