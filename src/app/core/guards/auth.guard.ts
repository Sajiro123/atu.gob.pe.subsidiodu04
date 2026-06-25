import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiAuthService } from '../services/api-auth.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const apiAuth = inject(ApiAuthService);
  const auth    = inject(AuthService);
  const router  = inject(Router);

  // Verifica sesión del API (JWT) primero, luego el fallback local
  if (apiAuth.isLoggedIn() || auth.isLoggedIn()) return true;

  router.navigate(['/login']);
  return false;
};
