import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { UserDashboard } from './components/user-dashboard/user-dashboard';
import { UserDetail } from './components/user-detail/user-detail';
import { UserCreate } from './components/user-create/user-create';
import { UniversityDashboard } from './components/university-dashboard/university-dashboard';
import { UniversityCreate } from './components/university-create/university-create';
import { UniversityDetail } from './components/university-detail/university-detail';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'usuarios/crear', component: UserCreate },
  { path: 'usuarios', component: UserDashboard },
  { path: 'usuario/:id', component: UserDetail },
  { path: 'universidades', component: UniversityDashboard },
  { path: 'universidades/crear', component: UniversityCreate },
  { path: 'universidad/:id', component: UniversityDetail },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
