import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario-service';
import { UniversidadService } from '../../services/universidad-service';
import { Universidad } from '../../models/universidad';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail implements OnInit {
  userForm: FormGroup;
  isEditing = false;
  userId: string | null = null;
  usuario?: Usuario;
  universidades: Universidad[] = [];
  filteredUniversidades: Universidad[] = [];
  universidadSearch = new FormControl('');
  showUniversidadesDropdown = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private universidadService: UniversidadService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rol: ['user', Validators.required],
      universidad: ['', Validators.required],
      password: [''] // Password control
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.loadUniversidades();
    if (this.userId) {
      this.loadUser();
    }

    this.universidadSearch.valueChanges.subscribe(value => {
      this.filterUniversidades(value || '');
    });
  }

  filterUniversidades(query: string): void {
    const term = query.toLowerCase();
    this.filteredUniversidades = this.universidades.filter(u => 
      u.nombre.toLowerCase().includes(term)
    );
  }

  selectUniversidad(uni: Universidad): void {
    this.userForm.patchValue({ universidad: uni._id });
    this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
    this.showUniversidadesDropdown = false;
  }

  getUniversidadNombre(id: string): string {
    const uni = this.universidades.find(u => u._id === id);
    return uni ? uni.nombre : '';
  }

  loadUniversidades(): void {
    this.universidadService.getUniversidades().subscribe({
      next: (data) => {
        this.universidades = data;
        this.filteredUniversidades = data;
      },
      error: (err) => console.error('Error loading universities:', err)
    });
  }

  loadUser(): void {
    this.usuarioService.getUsuario(this.userId!).subscribe({
        next: (user) => {
            this.usuario = user;
            this.userForm.patchValue({
              nombre: user.nombre,
              email: user.email,
              rol: user.rol,
              universidad: user.universidad?._id || user.universidad,
              password: '' // Always empty initially
            });

            // Set initial search value
            const uniId = user.universidad?._id || user.universidad;
            if (uniId) {
              const uni = this.universidades.find(u => u._id === uniId);
              if (uni) this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
            }

            this.userForm.disable();
            this.universidadSearch.disable();
        },
        error: (err) => console.error('Error loading user:', err)
    });
  }

  toggleEdit(): void {
    this.isEditing = true;
    this.userForm.enable();
    this.universidadSearch.enable();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.userForm.disable();
    this.universidadSearch.disable();
    if (this.usuario) {
      const uniId = this.usuario.universidad?._id || this.usuario.universidad;
      this.userForm.patchValue({
        nombre: this.usuario.nombre,
        email: this.usuario.email,
        rol: this.usuario.rol,
        universidad: uniId,
        password: ''
      });

      if (uniId) {
        const uni = this.universidades.find(u => u._id === uniId);
        if (uni) this.universidadSearch.setValue(uni.nombre, { emitEvent: false });
      }
    }
  }

  saveChanges(): void {
    if (this.userForm.valid && this.userId) {
      const dataToUpdate = { ...this.userForm.value };
      
      // If password is not provided, do not send it to avoid clearing it or backend errors
      if (!dataToUpdate.password || dataToUpdate.password.trim() === '') {
        delete dataToUpdate.password;
      }

      this.usuarioService.updateUsuario(this.userId, dataToUpdate).subscribe({
        next: (updatedUser) => {
          this.usuario = updatedUser;
          this.isEditing = false;
          this.userForm.disable();
          this.universidadSearch.disable();
          this.userForm.patchValue({ password: '' }); // Clear field after save
        },
        error: (err) => console.error('Error updating user:', err)
      });
    }
  }
}
