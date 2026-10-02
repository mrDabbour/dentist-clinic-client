import { safePatientReturnUrl } from '../services/patient-navigation';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { PatientAuthService, PATIENT_API_URL } from '../services/patient-auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private patientAuth: PatientAuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const api = new URL(PATIENT_API_URL);
    const target = new URL(request.url, window.location.origin);
    // Never send clinic tokens to Google or other external services.
    if (target.origin !== api.origin || !target.pathname.startsWith('/api/')) return next.handle(request);
    const patientRequest = target.pathname === '/api/patient-auth' || target.pathname.startsWith('/api/patient-auth/') || target.pathname === '/api/patient-booking' || target.pathname.startsWith('/api/patient-booking/') || target.pathname.startsWith('/api/patient-notifications') || (target.pathname.startsWith('/api/billing/') && !target.pathname.startsWith('/api/billing/staff/') && !target.pathname.endsWith('/verify-bank-payment'));
    const anonymous = target.pathname === '/api/patient-auth/google' || target.pathname === '/api/patient-auth/config';
    const token = anonymous ? null : patientRequest ? this.patientAuth.getToken() : localStorage.getItem('token');
    const authenticated = token && !request.headers.has('Authorization')
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
    return next.handle(authenticated).pipe(catchError((error: HttpErrorResponse) => {
      if (patientRequest && !anonymous && error.status === 401) {
        this.patientAuth.logout();
        void this.router.navigate(['/patient-login'], { queryParams: { returnUrl: safePatientReturnUrl(this.router.url) } });
      }
      return throwError(() => error);
    }));
  }
}


