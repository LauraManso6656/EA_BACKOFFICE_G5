import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { UserDashboard } from './components/user-dashboard/user-dashboard';
import { UserDetail } from './components/user-detail/user-detail';
import { UserCreate } from './components/user-create/user-create';
import { UniversityDashboard } from './components/university-dashboard/university-dashboard';
import { UniversityCreate } from './components/university-create/university-create';
import { UniversityDetail } from './components/university-detail/university-detail';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'usuarios/crear', component: UserCreate, canActivate: [authGuard] },
  { path: 'usuarios', component: UserDashboard, canActivate: [authGuard] },
  { path: 'usuario/:id', component: UserDetail, canActivate: [authGuard] },
  { path: 'universidades', component: UniversityDashboard, canActivate: [authGuard] },
  { path: 'universidades/crear', component: UniversityCreate, canActivate: [authGuard] },
  { path: 'universidad/:id', component: UniversityDetail, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
