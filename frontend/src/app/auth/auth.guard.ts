import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { from, map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If we already resolved the user this session, fast-path
  if (auth.currentUser() !== null) return true;

  // Otherwise verify the cookie with the backend
  return from(auth.init()).pipe(
    map(() => {
      if (auth.isLoggedIn()) return true;
      router.navigate(['/']);
      return false;
    })
  );
};
