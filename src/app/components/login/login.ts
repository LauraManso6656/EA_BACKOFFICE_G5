import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  errorMsg: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMsg = '';
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (res: any) => {
          if (res.usuario.rol === 'admin') {
            console.log('Login exitoso como Administrador');
            this.router.navigate(['/usuarios']);
          } else {
            console.warn('Intento de acceso denegado: no es admin');
            this.authService.logout();
            this.errorMsg = 'Acceso denegado: Se requieren permisos de administrador.';
          }
        },
        error: (err: any) => {
          console.error('Error en login:', err);
          this.errorMsg = 'Credenciales incorrectas o error en el servidor.';
        }
      });
    }
  }
}
