import { Component, OnInit, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { Usuario } from '../../models/usuario';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Universidad } from '../../models/universidad';
import { UsuarioService } from '../../services/usuario-service';
import { UniversidadService } from '../../services/universidad-service';
import { StatsService } from '../../services/stats-service';
import { Navbar } from '../navbar/navbar';


@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, Navbar],
  standalone: true,
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  totalUsuarios = 0;
  totalUniversidades = 0;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  backendTotalPages = 1;

  // Modal state
  showDeleteModal = false;
  userToDelete: Usuario | null = null;
  private platformId = inject(PLATFORM_ID);

  constructor(
    private api: UsuarioService,
    private universidadService: UniversidadService,
    private statsService: StatsService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.load();

      this.searchControl.valueChanges.subscribe(value => {
        this.currentPage = 1;
        this.load();
      });
    }
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    const searchTerm = this.searchControl.value ?? '';

    this.api.getUsuarios(this.currentPage, this.pageSize, searchTerm).subscribe({
      next: (res) => {
        this.usuariosFiltrados = res.docs;
        this.backendTotalPages = res.totalPages;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se han podido cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    // Obtener conteos reales desde el nuevo servicio de estadísticas
    this.statsService.getUserCount().subscribe({
      next: (res) => {
        this.totalUsuarios = res.count;
        this.cdr.detectChanges();
      }
    });

    this.statsService.getUniversityCount().subscribe({
      next: (res) => {
        this.totalUniversidades = res.count;
        this.cdr.detectChanges();
      }
    });
  }

  get usuariosVisibles(): Usuario[] {
    return this.usuariosFiltrados;
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
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  //Función: obtener nombre de universidad para mostrar en la tabla
  universidadLabel(u: Usuario): string {
    const org = u.universidad;
    if (!org) return '-';
    if (typeof org === 'string') return org;
    return (org as Universidad).nombre ?? '-';
  }

  editarUsuario(usuario: Usuario): void {
    this.router.navigate(['/usuario', usuario._id]);
  }

  // --- DELETE LOGIC ---
  openDeleteModal(usuario: Usuario): void {
    this.userToDelete = usuario;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (this.userToDelete) {
      this.api.hardDeleteUsuario(this.userToDelete._id).subscribe({
        next: () => {
          this.load();
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Error deleting user:', err);
          this.closeDeleteModal();
        }
      });
    }
  }

  // --- TOGGLE STATUS LOGIC ---
  onToggleStatus(usuario: Usuario, event: any): void {
    const checkValue = event.target.checked;

    if (checkValue) {
      // Switch is ON -> Recovery
      this.api.recoveryUsuario(usuario._id).subscribe({
        next: (res) => {
          usuario.activo = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Recovery failed:', err);
          event.target.checked = false; // rollback
        }
      });
    } else {
      // Switch is OFF -> Soft Delete
      this.api.softDeleteUsuario(usuario._id).subscribe({
        next: (res) => {
          usuario.activo = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Soft delete failed:', err);
          event.target.checked = true; // rollback
        }
      });
    }
  }
}
