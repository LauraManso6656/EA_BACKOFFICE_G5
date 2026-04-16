import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Universidad } from '../../models/universidad';
import { UniversidadService } from '../../services/universidad-service';
import { UsuarioService } from '../../services/usuario-service';
import { StatsService } from '../../services/stats-service';
import { Navbar } from '../navbar/navbar';

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
  pageSize = 5;

  // Modal state
  showDeleteModal = false;
  universityToDelete: Universidad | null = null;

  constructor(
    private universidadService: UniversidadService, 
    private usuarioService: UsuarioService,
    private statsService: StatsService,
    private cdr: ChangeDetectorRef, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.load();
    
    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
      this.universitiesFiltradas = this.universities.filter(university =>
        university.nombre.toLowerCase().includes(term) ||
        university.ubicacion.toLowerCase().includes(term)
      );
      this.currentPage = 1; // Reset to first page on search
    });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.universidadService.getUniversidades().subscribe({
      next: (res) => {
        this.universities = res;
        this.universitiesFiltradas = [...this.universities];
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
    const start = (this.currentPage - 1) * this.pageSize;
    return this.universitiesFiltradas.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.universitiesFiltradas.length / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
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
    this.universityToDelete = university;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.universityToDelete = null;
  }

  confirmDelete(): void {
    if (this.universityToDelete) {
      this.universidadService.deleteUniversidad(this.universityToDelete._id).subscribe({
        next: () => {
          this.load();
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Error deleting university:', err);
          this.closeDeleteModal();
        }
      });
    }
  }
}
