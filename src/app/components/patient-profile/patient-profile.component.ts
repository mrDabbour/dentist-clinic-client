import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { safePatientReturnUrl } from '../../services/patient-navigation';
import { Subject, takeUntil, timeout } from 'rxjs';
import { PatientAuthService } from '../../services/patient-auth.service';

@Component({
  selector: 'app-patient-profile',
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit, OnDestroy {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  isLoading = true;
  errorMessage = '';
  private readonly destroy$ = new Subject<void>();

  constructor(private patientAuthService: PatientAuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.patientAuthService.getProfile().pipe(timeout(15000), takeUntil(this.destroy$)).subscribe({
      next: profile => {
        this.firstName = profile.firstName;
        this.lastName = profile.lastName;
        this.email = profile.email;
        this.phone = profile.phone ?? '';
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.errorMessage = 'Unable to load your profile. Please sign in again.'; }
    });
  }

  continue(): void {
    if (this.isLoading) return;
    const digits = this.phone.replace(/\D/g, '');
    if (!/^\+?[0-9 ()-]+$/.test(this.phone) || digits.length < 7 || digits.length > 15) {
      this.errorMessage = 'Enter a valid phone number containing 7 to 15 digits.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.patientAuthService.updateProfile(this.phone).pipe(timeout(15000), takeUntil(this.destroy$)).subscribe({
      next: () => { this.isLoading = false; void this.router.navigateByUrl(safePatientReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))); },
      error: error => {
        this.isLoading = false;
        this.errorMessage = error.status === 409 ? 'This phone number is already registered. Please contact the clinic.'
          : 'Unable to save your contact number. Please try again.';
      }
    });
  }

  signOut(): void { this.patientAuthService.logout(); void this.router.navigate(['/patient-login']); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}

