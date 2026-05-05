import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { Universidad } from '../../models/universidad';
import { UniversidadService } from '../../services/universidad-service';
import { UsuarioService } from '../../services/usuario-service';
import { StatsService } from '../../services/stats-service';
import { Navbar } from '../navbar/navbar';
import { ConfirmService } from '../../services/confirm-service';

@Component({
  selector: 'app-university-dashboard',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Navbar],
  standalone: true,
  templateUrl: './university-dashboard.html',
  styleUrl: './university-dashboard.css',
})
export class UniversityDashboard implements OnInit {
  universities: Universidad[] = [];
  universitiesFiltradas: Universidad[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  totalUsersCount = 0;
  totalUniversitiesCount = 0;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  backendTotalPages = 1;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private universidadService: UniversidadService, 
    private usuarioService: UsuarioService,
    private statsService: StatsService,
    private cdr: ChangeDetectorRef, 
    private router: Router,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
      
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(value => {
        this.currentPage = 1; // Reset to first page on search
        this.load();
      });
    }
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    const searchTerm = this.searchControl.value ?? '';
    this.universidadService.getUniversidades(this.currentPage, this.pageSize, searchTerm).subscribe({
      next: (res) => {
        this.universities = res.docs;
        this.universitiesFiltradas = this.universities;
        this.backendTotalPages = res.totalPages;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se han podido cargar las universidades.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    // Obtener conteos reales desde el nuevo servicio de estadísticas
    this.statsService.getUserCount().subscribe({
      next: (res) => {
        this.totalUsersCount = res.count;
        this.cdr.detectChanges();
      }
    });

    this.statsService.getUniversityCount().subscribe({
      next: (res) => {
        this.totalUniversitiesCount = res.count;
        this.cdr.detectChanges();
      }
    });
  }

  get totalUsersAcrossUniversities(): number {
    return this.universities.reduce((acc, curr) => acc + (curr.numIntegrantes || 0), 0);
  }

  get universitiesVisibles(): Universidad[] {
    return this.universitiesFiltradas;
  }

  get totalPages(): number {
    return this.backendTotalPages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.load();
    }
  }

  getInitials(name: string): string {
    if (!name || typeof name !== 'string') return 'UN';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'UN';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  editarUniversity(university: Universidad): void {
    this.router.navigate(['/universidad', university._id]);
  }

  // --- DELETE LOGIC ---
  openDeleteModal(university: Universidad): void {
    this.confirmService.ask({
      title: 'Delete University?',
      message: `You are about to permanently delete the university "${university.nombre}". This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        this.universidadService.deleteUniversidad(university._id).subscribe({
          next: () => this.load(),
          error: (err) => console.error('Error deleting university:', err)
        });
      }
    });
  }
}
