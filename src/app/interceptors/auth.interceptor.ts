import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const token = authService.getToken();
  
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // SOLO redirigir al login si estamos en el navegador
      // En el servidor (SSR) dejamos que la petición falle para evitar el rebote al login
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
