import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { EMPTY, catchError, exhaustMap, filter, forkJoin, of, Subject, Subscription, takeUntil, timeout, timer } from 'rxjs';
import { PatientAuthService, PatientProfile } from '../../services/patient-auth.service';
import { DentalService } from '../../services/dental-service.service';
import { BookingConfiguration, BookingDentist, BookingSlot, PatientBooking, PatientBookingService } from '../../services/patient-booking.service';

@Component({
  selector: 'app-book-appointment', templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.css']
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  readonly steps = ['Service', 'Dentist', 'Date & time', 'Review'];
  step = 1;
  services: DentalService[] = [];
  dentists: BookingDentist[] = [];
  slots: BookingSlot[] = [];
  selectedService: DentalService | null = null;
  selectedDentist: BookingDentist | null = null;
  selectedSlot: BookingSlot | null = null;
  selectedDate = '';
  notes = '';
  config: BookingConfiguration | null = null;
  profile: PatientProfile | null = null;
  booking: PatientBooking | null = null;
  isLoading = true;
  isLoadingSlots = false;
  isSubmitting = false;
  errorMessage = '';
  slotError = '';
  private preferredDentistId = 0;
  private slotRequest?: Subscription;
  private readonly destroy$ = new Subject<void>();

  constructor(private auth: PatientAuthService, private bookingApi: PatientBookingService,
    private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadJourney();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntil(this.destroy$)).subscribe(() => {
      const id = Number(this.route.snapshot.queryParamMap.get('appointment'));
      if (id > 0 && id !== this.booking?.id) this.loadJourney();
    });
    timer(5000, 5000).pipe(exhaustMap(() => this.booking?.status === 'Pending' && !this.isLoading
      ? this.bookingApi.getBooking(this.booking.id).pipe(timeout(10000), catchError(() => EMPTY)) : EMPTY),
      takeUntil(this.destroy$)).subscribe(booking => { this.booking = booking; });
  }

  loadJourney(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const savedId = Number(this.route.snapshot.queryParamMap.get('appointment'));
    forkJoin({ services: this.auth.getAvailableServices(), dentists: this.bookingApi.getDentists(),
      config: this.bookingApi.getConfiguration(), profile: this.auth.getProfile(),
      booking: savedId > 0 ? this.bookingApi.getBooking(savedId) : of(null)
    }).pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
      next: result => {
        this.services = result.services;
        this.dentists = result.dentists;
        this.config = result.config;
        this.profile = result.profile;
        this.selectedDate = result.config.minDate;
        this.booking = result.booking;
        if (!result.booking) {
          const params = this.route.snapshot.queryParamMap;
          const serviceId = Number(params.get('service'));
          this.preferredDentistId = Number(params.get('dentist'));
          const service = this.services.find(s => s.id === serviceId);
          const dentist = this.dentists.find(d => d.id === this.preferredDentistId);
          if (service) this.selectService(service);
          if (dentist) this.selectedDentist = dentist;
          if (service && dentist) { this.step = 3; this.loadSlots(); }
          else if (service) this.step = 2;
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.errorMessage = 'Unable to load your booking. Please try again.'; }
    });
  }

  get canContinue(): boolean {
    return !this.isLoading && !this.isSubmitting &&
      (this.step === 1 ? !!this.selectedService : this.step === 2 ? !!this.selectedDentist :
        this.step === 3 ? !!this.selectedSlot && !this.isLoadingSlots : true);
  }

  selectService(service: DentalService): void {
    if (this.selectedService?.id !== service.id) {
      this.selectedService = service;
      this.selectedDentist = this.dentists.find(d => d.id === this.preferredDentistId) ?? null;
      this.clearSlots();
    }
    this.errorMessage = '';
  }

  selectDentist(dentist: BookingDentist): void { this.preferredDentistId = 0;
    if (this.selectedDentist?.id !== dentist.id) { this.selectedDentist = dentist; this.clearSlots(); }
    this.errorMessage = '';
  }

  next(): void {
    if (!this.canContinue || this.step >= 4) return;
    this.step++;
    this.errorMessage = '';
    if (this.step === 3) this.loadSlots();
  }

  goToStep(step: number): void {
    if (this.isSubmitting || step < 1 || step > this.step) return;
    this.step = step;
    this.errorMessage = '';
    if (step === 3) this.loadSlots();
  }

  loadSlots(): void {
    this.clearSlots();
    if (!this.selectedDate || !this.selectedService || !this.selectedDentist) return;
    this.isLoadingSlots = true;
    this.slotRequest = this.bookingApi.getSlots(this.selectedService.id, this.selectedDentist.id, this.selectedDate)
      .pipe(timeout(15000), takeUntil(this.destroy$)).subscribe({
        next: response => { this.slots = response.slots; this.isLoadingSlots = false; },
        error: () => { this.isLoadingSlots = false; this.slotError = 'Unable to load available times. Please try again.'; }
      });
  }

  selectSlot(slot: BookingSlot): void { this.selectedSlot = slot; this.errorMessage = ''; }

  submit(): void {
    if (this.isSubmitting || this.booking || this.step !== 4 || !this.selectedService || !this.selectedDentist || !this.selectedSlot) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.bookingApi.createBooking({ dentalServiceId: this.selectedService.id, dentistId: this.selectedDentist.id,
      startTime: this.selectedSlot.startTime, notes: this.notes.trim() || null
    }).pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
      next: booking => {
        this.booking = booking;
        this.isSubmitting = false;
        void this.router.navigate([], { relativeTo: this.route, queryParams: { appointment: booking.id }, replaceUrl: true });
      },
      error: error => {
        this.isSubmitting = false;
        if (error.status === 409) {
          this.step = 3;
          this.loadSlots();
          this.errorMessage = 'That time was just booked. Please choose another available time.';
        } else {
          this.errorMessage = error.error?.message ?? 'Unable to submit your booking. Please try again.';
        }
      }
    });
  }

  newBooking(): void {
    this.preferredDentistId = 0; this.booking = null; this.step = 1; this.selectedService = null; this.selectedDentist = null;
    this.clearSlots(); this.notes = ''; this.errorMessage = '';
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  signOut(): void { this.auth.logout(); void this.router.navigate(['/patient-login']); }

  formatTime(value: string): string {
    return new Intl.DateTimeFormat('en-NZ', { timeZone: this.config?.timeZone ?? 'Pacific/Auckland',
      hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-NZ', { timeZone: this.config?.timeZone ?? 'Pacific/Auckland',
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
  }

  private clearSlots(): void {
    this.slotRequest?.unsubscribe(); this.slots = []; this.selectedSlot = null;
    this.slotError = ''; this.isLoadingSlots = false;
  }

  ngOnDestroy(): void { this.slotRequest?.unsubscribe(); this.destroy$.next(); this.destroy$.complete(); }
}
