import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UniversidadService } from '../../services/universidad-service';
import { UsuarioService } from '../../services/usuario-service';
import { Universidad } from '../../models/universidad';
import { Usuario } from '../../models/usuario';
import { inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm-service';
import { GradoService } from '../../services/grado-service';
import { AsignaturaService } from '../../services/asignatura-service';

@Component({
  selector: 'app-university-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './university-detail.html',
  styleUrl: './university-detail.css',
})
export class UniversityDetail implements OnInit {
  universityForm: FormGroup;
  isEditingNombre = false;
  isEditingUbicacion = false;
  universityId: string | null = null;
  university?: Universidad;
  allUsers: Usuario[] = [];
  universityUsers: Usuario[] = [];
  filteredUsers: Usuario[] = [];
  searchTerm: string = '';
  private confirmService = inject(ConfirmService);
  private gradoService = inject(GradoService);
  private asignaturaService = inject(AsignaturaService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'details' | 'users' | 'grados' = 'details';

  // Degrees
  grados: any[] = [];
  selectedGrado: any = null;
  newGradoNombre: string = '';

  // Subjects
  gradoAsignaturas: any[] = [];
  newAsignaturaNombre: string = '';

  constructor(
    private fb: FormBuilder,
    private universidadService: UniversidadService,
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.universityForm = this.fb.group({
      nombre: ['', Validators.required],
      ubicacion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.universityId = this.route.snapshot.paramMap.get('id');
    if (this.universityId) {
      this.loadUniversity();
    }
  }

  filterUniversityUsers(): void {
    if (!this.university) return;
    this.universityUsers = this.university.usuarios || [];
    this.applyUserSearch();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyUserSearch();
  }

  applyUserSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
        this.filteredUsers = [...this.universityUsers];
        return;
    }

    this.filteredUsers = this.universityUsers.filter(u => 
        u.nombre.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.rol.toLowerCase().includes(term)
    );
  }

  loadUniversity(): void {
    this.universidadService.getUniversidad(this.universityId!).subscribe({
      next: (uni) => {
        this.university = uni;
        this.universityForm.patchValue({
          nombre: uni.nombre,
          ubicacion: uni.ubicacion
        });
        this.filterUniversityUsers();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading university:', err)
    });
  }

  toggleEdit(field: 'nombre' | 'ubicacion'): void {
    if (field === 'nombre') this.isEditingNombre = true;
    if (field === 'ubicacion') this.isEditingUbicacion = true;
  }

  cancelEdit(field: 'nombre' | 'ubicacion'): void {
    if (field === 'nombre') {
      this.isEditingNombre = false;
      this.universityForm.patchValue({ nombre: this.university?.nombre });
    }
    if (field === 'ubicacion') {
      this.isEditingUbicacion = false;
      this.universityForm.patchValue({ ubicacion: this.university?.ubicacion });
    }
  }

  saveField(field: 'nombre' | 'ubicacion'): void {
    if (this.universityForm.valid && this.universityId) {
      const dataToUpdate = { [field]: this.universityForm.get(field)?.value };

      this.universidadService.updateUniversidad(this.universityId, dataToUpdate as any).subscribe({
        next: (updatedUni) => {
          this.university = updatedUni;
          if (field === 'nombre') this.isEditingNombre = false;
          if (field === 'ubicacion') this.isEditingUbicacion = false;
          this.filterUniversityUsers();
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error updating university:', err)
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
  setActiveTab(tab: 'details' | 'users' | 'grados'): void {
    this.activeTab = tab;
    if (tab === 'grados') {
      this.loadGrados();
    }
  }

  loadGrados(): void {
    if (!this.universityId) return;
    const self = this;
    this.gradoService.getGradosByUniversidad(this.universityId).subscribe({
      next: (grados) => {
        if (self) {
          self.grados = grados || [];
          if (self.grados.length > 0 && !self.selectedGrado) {
            self.selectGrado(self.grados[0]);
          }
          self.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading grados:', err)
    });
  }

  selectGrado(grado: any): void {
    this.selectedGrado = grado;
    if (grado && grado._id) {
      this.loadGradoAsignaturas(grado._id);
    }
  }

  loadGradoAsignaturas(gradoId: string): void {
    const self = this;
    this.gradoService.getAsignaturasByGrado(gradoId).subscribe({
      next: (asignaturas) => {
        if (self) {
          self.gradoAsignaturas = asignaturas || [];
          self.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error loading asignaturas:', err)
    });
  }

  createGrado(): void {
    if (!this.newGradoNombre || !this.newGradoNombre.trim() || !this.universityId) return;
    const newGrado = {
      nombre: this.newGradoNombre.trim(),
      universidad: this.universityId
    };

    const self = this;
    this.gradoService.createGrado(newGrado).subscribe({
      next: (savedGrado) => {
        if (self) {
          if (self.grados) {
            self.grados.push(savedGrado);
          }
          self.newGradoNombre = '';
          self.selectGrado(savedGrado);
          self.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error creating grado:', err)
    });
  }

  deleteGrado(gradoId: string, event: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const self = this;
    this.confirmService.ask({
      title: 'Eliminar Grado?',
      message: '¿Estás seguro de que quieres eliminar este grado? Esta acción también eliminará su asociación en la base de datos.',
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: () => {
        self.gradoService.deleteGrado(gradoId).subscribe({
          next: () => {
            if (self) {
              self.grados = (self.grados || []).filter(g => g._id !== gradoId);
              if (self.selectedGrado?._id === gradoId) {
                self.selectedGrado = self.grados.length > 0 ? self.grados[0] : null;
                if (self.selectedGrado && self.selectedGrado._id) {
                  self.loadGradoAsignaturas(self.selectedGrado._id);
                } else {
                  self.gradoAsignaturas = [];
                }
              }
              self.cdr.detectChanges();
            }
          },
          error: (err) => console.error('Error deleting grado:', err)
        });
      }
    });
  }

  createAsignatura(): void {
    if (!this.newAsignaturaNombre || !this.newAsignaturaNombre.trim() || !this.selectedGrado) return;
    const self = this;

    this.asignaturaService.createAsignatura({ nombre: this.newAsignaturaNombre.trim() }).subscribe({
      next: (savedAsignatura) => {
        if (self && self.selectedGrado) {
          const updatedAsignaturas = [...(self.selectedGrado.asignaturas || []).map((a: any) => typeof a === 'string' ? a : a._id), savedAsignatura._id];
          
          self.gradoService.updateGrado(self.selectedGrado._id, { asignaturas: updatedAsignaturas }).subscribe({
            next: (updatedGrado) => {
              if (self) {
                self.selectedGrado = updatedGrado;
                if (updatedGrado && updatedGrado._id) {
                  self.loadGradoAsignaturas(updatedGrado._id);
                }
                self.newAsignaturaNombre = '';
                
                if (self.grados) {
                  const idx = self.grados.findIndex(g => g._id === updatedGrado._id);
                  if (idx !== -1) {
                    self.grados[idx] = updatedGrado;
                  }
                }
                self.cdr.detectChanges();
              }
            },
            error: (err) => console.error('Error updating grado with new asignatura:', err)
          });
        }
      },
      error: (err) => console.error('Error creating asignatura:', err)
    });
  }

  deleteAsignatura(asignaturaId: string): void {
    if (!this.selectedGrado) return;
    const self = this;
    this.confirmService.ask({
      title: 'Eliminar Asignatura?',
      message: '¿Estás seguro de que quieres quitar esta asignatura del grado? (También se eliminará de la base de datos).',
      type: 'warning',
      confirmText: 'Eliminar',
      onConfirm: () => {
        if (self && self.selectedGrado) {
          const updatedAsignaturas = (self.selectedGrado.asignaturas || [])
            .map((a: any) => typeof a === 'string' ? a : a._id)
            .filter((id: string) => id !== asignaturaId);

          self.gradoService.updateGrado(self.selectedGrado._id, { asignaturas: updatedAsignaturas }).subscribe({
            next: (updatedGrado) => {
              if (self) {
                self.selectedGrado = updatedGrado;
                self.asignaturaService.deleteAsignatura(asignaturaId).subscribe({
                  next: () => {
                    if (self && updatedGrado && updatedGrado._id) {
                      self.loadGradoAsignaturas(updatedGrado._id);
                      if (self.grados) {
                        const idx = self.grados.findIndex(g => g._id === updatedGrado._id);
                        if (idx !== -1) {
                          self.grados[idx] = updatedGrado;
                        }
                      }
                    }
                    if (self) {
                      self.cdr.detectChanges();
                    }
                  },
                  error: (err) => console.error('Error deleting asignatura:', err)
                });
              }
            },
            error: (err) => console.error('Error removing asignatura from grado:', err)
          });
        }
      }
    });
  }

  openUnlinkModal(user: Usuario): void {
    this.confirmService.ask({
      title: 'Unlink User?',
      message: `Are you sure you want to unlink "${user.nombre}" from this university?`,
      type: 'warning',
      confirmText: 'Unlink',
      onConfirm: () => {
        const dataToUpdate = { universidad: null };
        this.usuarioService.updateUsuario(user._id, dataToUpdate as any).subscribe({
          next: () => this.loadUniversity(),
          error: (err: any) => console.error('Error unlinking user:', err)
        });
      }
    });
  }

  showProfileDropdown = false;

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
