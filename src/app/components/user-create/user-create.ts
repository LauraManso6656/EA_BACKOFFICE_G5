import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario-service';
import { UniversidadService } from '../../services/universidad-service';
import { Universidad } from '../../models/universidad';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-create.html',
  styleUrl: './user-create.css',
})
export class UserCreate implements OnInit {
  userForm: FormGroup;
  universidades: Universidad[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private universidadService: UniversidadService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['user', Validators.required],
      universidad: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUniversidades();
  }

  loadUniversidades(): void {
    this.universidadService.getUniversidades(1, 1000).subscribe({
      next: (res: any) => {
        this.universidades = res.docs || [];
      },
      error: (err) => console.error('Error loading universities:', err)
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const newUser = { ...this.userForm.value };
      
      this.usuarioService.createUsuario(newUser).subscribe({
        next: () => {
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.isSubmitting = false;
        }
      });
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
