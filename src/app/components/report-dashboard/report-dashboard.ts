import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../services/report-service';
import { StatsService, ReportStats } from '../../services/stats-service';
import { Report } from '../../models/report';
import { Navbar } from '../navbar/navbar';

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
    comment: 0
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Filters
  searchControl = new FormControl('');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');
  tipoFilter: 'all' | 'user' | 'post' | 'comment' = 'all';

  // Modals
  showDeleteModal = false;
  reportToDelete: Report | null = null;
  isUpdating = false;

  // Toggles
  showOnlyActive = true; 

  private platformId = inject(PLATFORM_ID);

  constructor(
    private reportService: ReportService,
    private statsService: StatsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadReports();
      this.loadStats();
      
      this.searchControl.valueChanges.subscribe(() => this.filterReports());
      this.startDateControl.valueChanges.subscribe(() => this.filterReports());
      this.endDateControl.valueChanges.subscribe(() => this.filterReports());
    }
  }

  loadReports(): void {
    this.reportService.getReports(this.currentPage, this.pageSize).subscribe({
      next: (res) => {
        this.reports = res.docs;
        this.totalPages = res.totalPages;
        this.filterReports();
      },
      error: (err) => console.error('Error loading reports:', err)
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
    const term = this.searchControl.value?.toLowerCase() || '';
    const startDate = this.startDateControl.value ? new Date(this.startDateControl.value) : null;
    const endDate = this.endDateControl.value ? new Date(this.endDateControl.value) : null;
    
    // Set endDate to direct end of day to include that day
    if (endDate) endDate.setHours(23, 59, 59, 999);

    this.filteredReports = this.reports.filter(r => {
      const matchSearch = r.descripcion.toLowerCase().includes(term) || 
                          r.objetivoId.toLowerCase().includes(term);
      const matchTipo = this.tipoFilter === 'all' || r.tipo === this.tipoFilter;
      const matchActive = !this.showOnlyActive || r.estado !== 'resuelto';
      
      // Date Filter
      let matchDate = true;
      if (r.createdAt) {
          const reportDate = new Date(r.createdAt);
          if (startDate && reportDate < startDate) matchDate = false;
          if (endDate && reportDate > endDate) matchDate = false;
      }
      
      return matchSearch && matchTipo && matchActive && matchDate;
    });

    this.updateVisibleReports();
  }

  toggleActiveFilter(): void {
    this.showOnlyActive = !this.showOnlyActive;
    this.filterReports();
  }

  updateVisibleReports(): void {
    // For backend pagination, visibleReports is directly the filtered elements of the current page.
    this.visibleReports = this.filteredReports;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReports();
    }
  }

  setTipoFilter(tipo: 'all' | 'user' | 'post' | 'comment'): void {
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
    this.reportToDelete = report;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.reportToDelete = null;
  }

  confirmDelete(): void {
    if (!this.reportToDelete) return;

    this.reportService.deleteReport(this.reportToDelete._id).subscribe({
      next: () => {
        this.reports = this.reports.filter(r => r._id !== this.reportToDelete?._id);
        this.filterReports();
        this.loadStats();
        this.closeDeleteModal();
      },
      error: (err) => console.error('Error deleting report:', err)
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
