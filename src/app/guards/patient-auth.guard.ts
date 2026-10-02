import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, timeout } from 'rxjs';
import { PatientAuthService } from '../services/patient-auth.service';

export const patientAuthGuard: CanActivateFn = (_route, state) => {
  const auth = inject(PatientAuthService);
  const router = inject(Router);
  if (!auth.getToken()) return router.createUrlTree(['/patient-login'], { queryParams: { returnUrl: state.url } });
  return auth.getProfile().pipe(timeout(15000), map(profile =>
    state.url.startsWith('/book') && profile.requiresProfileCompletion
      ? router.createUrlTree(['/patient-profile'], { queryParams: { returnUrl: state.url } }) : true),
    catchError(() => of(router.createUrlTree(['/patient-login'], { queryParams: { returnUrl: state.url } }))));
};
