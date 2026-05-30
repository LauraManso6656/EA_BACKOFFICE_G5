import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UniversidadService } from '../../services/universidad-service';

@Component({
  selector: 'app-university-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './university-create.html',
  styleUrl: './university-create.css',
})
export class UniversityCreate {
  universityForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private universidadService: UniversidadService,
    private router: Router,
  ) {
    this.universityForm = this.fb.group({
      nombre: ['', Validators.required],
      ubicacion: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.universityForm.valid) {
      this.isSubmitting = true;
      const newUniversity = { ...this.universityForm.value };

      this.universidadService.createUniversidad(newUniversity).subscribe({
        next: () => {
          this.router.navigate(['/universidades']);
        },
        error: (err) => {
          console.error('Error creating university:', err);
          this.isSubmitting = false;
        },
      });
    } else {
      this.universityForm.markAllAsTouched();
    }
  }
}
