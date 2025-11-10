import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_TOKEN_KEY, ROUTES } from '../constants/app.constants';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) return true;
  router.navigateByUrl(ROUTES.login);
  return false;
};
