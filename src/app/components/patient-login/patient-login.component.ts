import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { safePatientReturnUrl } from '../../services/patient-navigation';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil, timeout } from 'rxjs';
import { PatientAuthService } from '../../services/patient-auth.service';

interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    auto_select: boolean;
    callback: (response: { credential?: string }) => void;
  }): void;
  renderButton(element: HTMLElement, options: {
    theme: string; size: string; text: string; shape: string; width: number;
  }): void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } }; }
}

@Component({
  selector: 'app-patient-login',
  templateUrl: './patient-login.component.html',
  styleUrls: ['./patient-login.component.css']
})
export class PatientLoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButton', { static: true }) googleButton!: ElementRef<HTMLElement>;
  errorMessage = '';
  isLoading = false;
  isPreparing = true;
  private destroyed = false;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly destroy$ = new Subject<void>();

  constructor(private patientAuthService: PatientAuthService,
    private ngZone: NgZone, private router: Router, private route: ActivatedRoute) {}

  private continueJourney(requiresProfile: boolean): void {
    const returnUrl = safePatientReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    if (requiresProfile) void this.router.navigate(['/patient-profile'], { queryParams: { returnUrl } });
    else void this.router.navigateByUrl(returnUrl);
  }
  ngAfterViewInit(): void {
    this.timer = setTimeout(() => this.startSignIn(), 0);
  }

  private startSignIn(): void {
    if (this.destroyed) return;
    if (this.patientAuthService.getToken()) {
      this.patientAuthService.getProfile().pipe(timeout(15000), takeUntil(this.destroy$)).subscribe({
        next: profile => { this.continueJourney(profile.requiresProfileCompletion); },
        error: () => { this.patientAuthService.logout(); this.prepareGoogle(); }
      });
    } else {
      this.prepareGoogle();
    }
  }

  retry(): void {
    if (this.isLoading || this.isPreparing) return;
    if (!window.google?.accounts.id) {
      // A failed async script does not reload itself when the connection recovers.
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]')?.remove();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    this.prepareGoogle();
  }

  private prepareGoogle(): void {
    if (this.destroyed) return;
    clearTimeout(this.timer);
    this.errorMessage = '';
    this.isPreparing = true;
    this.googleButton.nativeElement.replaceChildren();
    this.patientAuthService.getConfiguration().pipe(timeout(15000), takeUntil(this.destroy$)).subscribe({
      next: config => this.waitForGoogle(config.clientId, Date.now() + 10000),
      error: () => this.showError('Sign-in is temporarily unavailable. Please try again.')
    });
  }

  private waitForGoogle(clientId: string, deadline: number): void {
    if (this.destroyed) return;
    const identity = window.google?.accounts.id;
    if (!identity) {
      if (Date.now() >= deadline) {
        this.showError('Google could not load. Check your connection, then try again.');
        return;
      }
      this.timer = setTimeout(() => this.waitForGoogle(clientId, deadline), 200);
      return;
    }
    try {
      identity.initialize({ client_id: clientId, auto_select: false,
        callback: response => this.ngZone.run(() => this.handleGoogleLogin(response.credential)) });
      identity.renderButton(this.googleButton.nativeElement, {
        theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular',
        width: Math.min(320, this.googleButton.nativeElement.clientWidth || 320)
      });
      this.isPreparing = false;
    } catch {
      this.showError('Google sign-in could not start. Please try again.');
    }
  }

  private handleGoogleLogin(credential?: string): void {
    if (this.destroyed || this.isLoading) return;
    if (!credential) { this.showError('Google sign-in could not be verified. Please try again.'); return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.patientAuthService.loginWithGoogle(credential)
      .pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
        next: auth => {
          this.isLoading = false;
          this.continueJourney(auth.requiresProfileCompletion);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          const message = error.status === 409 ? 'Please contact the clinic to connect your existing patient record.'
            : error.status === 429 ? 'Too many sign-in attempts. Please wait a minute and try again.'
            : error.status === 401 ? 'Google sign-in could not be verified. Please try again.'
            : 'Unable to sign in right now. Check your connection and try again.';
          this.showError(message);
        }
      });
  }

  private showError(message: string): void {
    this.isPreparing = false;
    this.errorMessage = message;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.timer);
    this.destroy$.next();
    this.destroy$.complete();
  }
}


