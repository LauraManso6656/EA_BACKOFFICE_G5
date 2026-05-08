import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { UserDashboard } from './components/user-dashboard/user-dashboard';
import { UserDetail } from './components/user-detail/user-detail';
import { UserCreate } from './components/user-create/user-create';
import { UniversityDashboard } from './components/university-dashboard/university-dashboard';
import { UniversityCreate } from './components/university-create/university-create';
import { UniversityDetail } from './components/university-detail/university-detail';
import { HomeDashboard } from './components/home-dashboard/home-dashboard';
import { ReportDashboard } from './components/report-dashboard/report-dashboard';
import { ReportDetail } from './components/report-detail/report-detail';
import { PostDashboard } from './components/post-dashboard/post-dashboard';
import { BugDashboard } from './components/bug-dashboard/bug-dashboard';
import { BugDetail } from './components/bug-detail/bug-detail';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'home', component: HomeDashboard, canActivate: [authGuard] },
  { path: 'usuarios/crear', component: UserCreate, canActivate: [authGuard] },
  { path: 'usuarios', component: UserDashboard, canActivate: [authGuard] },
  { path: 'usuario/:id', component: UserDetail, canActivate: [authGuard] },
  { path: 'universidades', component: UniversityDashboard, canActivate: [authGuard] },
  { path: 'universidades/crear', component: UniversityCreate, canActivate: [authGuard] },
  { path: 'universidad/:id', component: UniversityDetail, canActivate: [authGuard] },
  { path: 'reports', component: ReportDashboard, canActivate: [authGuard] },
  { path: 'report/:id', component: ReportDetail, canActivate: [authGuard] },
  { path: 'posts', component: PostDashboard, canActivate: [authGuard] },
  { path: 'bugs', component: BugDashboard, canActivate: [authGuard] },
  { path: 'bug/:id', component: BugDetail, canActivate: [authGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
