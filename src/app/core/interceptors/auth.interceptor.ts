import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiAuthService } from '../services/api-auth.service';
import { SessionService } from '../services/session.service';

/**
 * Interceptor funcional JWT (Angular 17+).
 *
 * Responsabilidades:
 *  1. Inyecta el header `Authorization: Bearer <token>` en cada request
 *     autenticado (si hay token en sesión).
 *  2. Si el servidor responde 401 (token expirado / inválido):
 *     - Limpia la sesión local
 *     - Detiene el timer de sesión
 *     - Redirige al login
 *  3. Si el servidor responde 403 (sin permisos):
 *     - Deja el token intacto (no hace logout)
 *     - Solo propaga el error para que el componente lo maneje
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const apiAuthService = inject(ApiAuthService);
  const sessionService = inject(SessionService);
  const router         = inject(Router);

  const token = apiAuthService.getAccessToken();
  const isLoginRequest = req.url.includes('/auth/login');

  // Clona la request y añade el header si hay token (y no es la petición de login)
  const authReq = (token && !isLoginRequest)
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Token expirado o inválido → limpiar sesión y redirigir
        sessionService.stopSession();
        apiAuthService.clearSession();
        router.navigate(['/login']);
      }
      // Para 403 solo propagamos el error; el componente decide cómo manejarlo
      return throwError(() => err);
    }),
  );
};
