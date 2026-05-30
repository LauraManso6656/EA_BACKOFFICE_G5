import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Logging from '../../../library/Logging';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm: FormGroup;
  errorMsg: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMsg = '';
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (res: any) => {
          if (res.usuario.rol === 'admin') {
            Logging.info('Login exitoso como Administrador');
            this.router.navigate(['/home']);
          } else {
            Logging.warning('Intento de acceso denegado: no es admin');
            this.authService.logout();
            this.errorMsg = 'Acceso denegado: Se requieren permisos de administrador.';
          }
        },
        error: (err: any) => {
          Logging.error(`Error en login: ${err}`);
          this.errorMsg = 'Credenciales incorrectas o error en el servidor.';
        },
      });
    }
  }
}
