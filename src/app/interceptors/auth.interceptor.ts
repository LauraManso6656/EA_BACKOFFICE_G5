import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError, switchMap, filter, take, of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { SessionService } from '../services/session-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const platformId = inject(PLATFORM_ID);

  const token = authService.getToken();

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es un 401 y no es la propia petición de login
      if (error.status === 401 && !req.url.includes('/auth/login') && isPlatformBrowser(platformId)) {

        // Si ya nos dio error en el propio refresh, hacemos logout directo
        if (req.url.includes('/auth/refresh')) {
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => error);
        }

        // Mostramos el modal de sesión
        sessionService.showSessionModal();

        // Esperamos a la decisión del usuario
        return sessionService.sessionDecision$.pipe(
          take(1),
          switchMap(extend => {
            if (extend) {
              // Intentar refrescar el token
              return authService.refreshToken().pipe(
                switchMap(res => {
                  // Reintentar la petición original con el nuevo token
                  const newRequest = req.clone({
                    setHeaders: { Authorization: `Bearer ${res.accessToken}` }
                  });
                  return next(newRequest);
                }),
                catchError(err => {
                  authService.logout();
                  router.navigate(['/login']);
                  return throwError(() => err);
                })
              );
            } else {
              // El usuario eligió cerrar sesión
              authService.logout();
              router.navigate(['/login']);
              return of(); // Opcional: silenciar el error original
            }
          })
        );
      }
      return throwError(() => error);
    })
  );
};
