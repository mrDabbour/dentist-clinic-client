import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, EMPTY, Subject, catchError, combineLatest, switchMap, takeUntil, timeout, timer } from 'rxjs';
import { PatientAuthService } from '../../services/patient-auth.service';
import { MyAppointmentsPage, PatientBookingService, PatientVisit } from '../../services/patient-booking.service';
@Component({ selector: 'app-my-appointments', templateUrl: './my-appointments.component.html', styleUrls: ['./my-appointments.component.css'] })
export class MyAppointmentsComponent implements OnInit, OnDestroy {
  data: MyAppointmentsPage | null = null;
  loading = true; errorMessage = ''; updatedAt: Date | null = null;
  readonly state = new BehaviorSubject<{ view: 'upcoming' | 'history' | 'all'; page: number }>({ view: 'upcoming', page: 1 });
  private readonly destroy$ = new Subject<void>();
  constructor(private api: PatientBookingService, private auth: PatientAuthService, private router: Router) {}
  ngOnInit(): void {
    combineLatest([this.state, timer(0, 15000)]).pipe(switchMap(([state]) =>
      this.api.getMyAppointments(state.view, state.page).pipe(timeout(15000), catchError(() => {
        this.loading = false; this.errorMessage = 'Unable to update your appointments. Please try again.'; return EMPTY;
      }))), takeUntil(this.destroy$)).subscribe(data => {
        this.data = data; this.loading = false; this.errorMessage = ''; this.updatedAt = new Date();
      });
  }
  changeView(view: 'upcoming' | 'history' | 'all'): void {
    if (this.state.value.view === view) return;
    this.loading = true; this.data = null; this.state.next({ view, page: 1 });
  }
  changePage(page: number): void { if (page < 1) return; this.loading = true; this.state.next({ ...this.state.value, page }); }
  refresh(): void { this.loading = true; this.state.next({ ...this.state.value }); }
  paymentLabel(visit: PatientVisit): string {
    const status = visit.invoice?.paymentStatus;
    if (status === 'Paid') return 'Paid';
    if (status === 'AwaitingVerification') return 'Awaiting bank verification';
    if (status === 'Unpaid') return 'Payment due';
    return ['Confirmed', 'Completed'].includes(visit.status) ? 'Payment request available' : 'No payment requested';
  }
  canOpenPayment(visit: PatientVisit): boolean { return visit.invoice?.paymentStatus === 'Paid' || ['Confirmed', 'Completed'].includes(visit.status); }
  statusLabel(status: string): string { return ({ Pending: 'Awaiting confirmation', NoShow: 'Missed appointment' } as Record<string,string>)[status] ?? status; }
  formatDate(value: string): string { return new Intl.DateTimeFormat('en-NZ', { timeZone: this.data?.timeZone ?? 'Pacific/Auckland', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); }
  formatTime(value: string): string { return new Intl.DateTimeFormat('en-NZ', { timeZone: this.data?.timeZone ?? 'Pacific/Auckland', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
  changeRequestLink(visit: PatientVisit): string { return `mailto:mohammeddabboornz@gmail.com?subject=${encodeURIComponent(`Appointment change request #${visit.id}`)}&body=${encodeURIComponent(`Hello, I would like to ask about changing appointment #${visit.id} (${visit.serviceName}).\n\nMy requested change is:\n`)}`; }
  signOut(): void { this.auth.logout(); void this.router.navigate(['/patient-login']); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.state.complete(); }
}
