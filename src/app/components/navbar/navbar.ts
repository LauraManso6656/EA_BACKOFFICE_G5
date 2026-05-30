import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(private router: Router) {}

  logout() {
    //aqui se puede eliminar el token de sesion
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirigir a la página de login
    this.router.navigate(['/login']);
  }
}
