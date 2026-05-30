import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UniversidadService } from '../../services/universidad-service';
import { UsuarioService } from '../../services/usuario-service';
import { Universidad } from '../../models/universidad';
import { Usuario } from '../../models/usuario';
import { inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm-service';

@Component({
  selector: 'app-university-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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

  constructor(
    private fb: FormBuilder,
    private universidadService: UniversidadService,
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.universityForm = this.fb.group({
      nombre: ['', Validators.required],
      ubicacion: ['', Validators.required],
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

    this.filteredUsers = this.universityUsers.filter(
      (u) =>
        u.nombre.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.rol.toLowerCase().includes(term),
    );
  }

  loadUniversity(): void {
    this.universidadService.getUniversidad(this.universityId!).subscribe({
      next: (uni) => {
        this.university = uni;
        this.universityForm.patchValue({
          nombre: uni.nombre,
          ubicacion: uni.ubicacion,
        });
        this.filterUniversityUsers();
      },
      error: (err) => console.error('Error loading university:', err),
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
        },
        error: (err) => console.error('Error updating university:', err),
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
          error: (err: any) => console.error('Error unlinking user:', err),
        });
      },
    });
  }
}
