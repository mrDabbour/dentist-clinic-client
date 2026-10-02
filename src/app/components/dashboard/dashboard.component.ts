import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, finalize, takeUntil, timeout } from 'rxjs';
import { Appointment, AppointmentService } from '../../services/appointment.service';

interface ClinicApp {
  id: string; title: string; route: string; description: string; accent: string; icon: string; steps: string[];
}
@Component({ selector: 'app-dashboard', templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.css'] })
export class DashboardComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  loading = true;
  errorMessage = '';
  actionMessage = '';
  appSearch = '';
  selectedAppId = 'appointments';
  readonly today = new Date();
  readonly busyAppointments = new Set<number>();
  private readonly destroy$ = new Subject<void>();
  readonly apps: ClinicApp[] = [
    { id: 'appointments', title: 'Appointments', route: '/appointments', description: 'Keep every visit moving, from request to completion.', accent: '#087f83', icon: 'M5 4h14v16H5z M8 2v4 M16 2v4 M5 9h14 M8 13h3 M8 16h7', steps: ['Review new booking requests', 'Confirm a visit and notify the patient', 'Manage the clinic schedule'] },
    { id: 'patients', title: 'Patients', route: '/patients', description: 'Find a patient and pick up where their care left off.', accent: '#5373b4', icon: 'M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 21v-2a8 8 0 0 1 16 0v2', steps: ['Find the patient record', 'Check contact details', 'Review their appointment history'] },
    { id: 'dentists', title: 'Dentists', route: '/dentists', description: 'Manage the clinicians behind your patient care.', accent: '#9465a5', icon: 'M8 4H4v6a4 4 0 0 0 8 0V4h-4 M8 14v2a5 5 0 0 0 10 0v-3 M20 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0', steps: ['Browse your clinical team', 'Review dentist profiles', 'Keep active clinician details current'] },
    { id: 'services', title: 'Services', route: '/services-management', description: 'Keep treatments, appointment lengths and prices clear.', accent: '#b67b36', icon: 'M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h3 M14 15h2 M8 18h8', steps: ['Review the treatment catalogue', 'Update prices and appointment lengths', 'Manage which services patients can book'] },
    { id: 'billing', title: 'Invoices & payments', route: '/billing', description: 'Follow payment progress and verify bank deposits.', accent: '#398467', icon: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 7h8 M8 11h8 M8 15h4', steps: ['Find an issued invoice', 'Check deposits against your bank records', 'Verify payment and update its status'] }
  ];
  constructor(private appointmentService: AppointmentService, private router: Router) {}
  get staffRole(): string {
    try {
      const payload = (localStorage.getItem('token') ?? '').split('.')[1];
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? claims.role ?? 'Staff';
    } catch { return 'Staff'; }
  }
  get availableApps(): ClinicApp[] { return this.apps.filter(app => app.id !== 'billing' || ['Admin', 'Receptionist'].includes(this.staffRole)); }
  get visibleApps(): ClinicApp[] {
    const search = this.appSearch.trim().toLowerCase();
    return this.availableApps.filter(app => `${app.title} ${app.description} ${app.steps.join(' ')}`.toLowerCase().includes(search));
  }
  get selectedApp(): ClinicApp { return this.visibleApps.find(app => app.id === this.selectedAppId) ?? this.visibleApps[0] ?? this.availableApps[0]; }
  appHint(app: ClinicApp): string {
    if (app.id !== 'appointments') return { patients: 'Patient records', dentists: 'Clinical team', services: 'Treatments & pricing', billing: 'Payment tracking' }[app.id] ?? '';
    if (this.loading) return 'Checking your schedule...';
    if (this.errorMessage) return 'Schedule unavailable';
    return this.pendingAppointments ? `${this.pendingAppointments} awaiting confirmation` : 'Your booking requests are up to date';
  }
  get nextAppointment(): Appointment | undefined {
    return this.appointments.filter(a => a.status === 'Confirmed' && Date.parse(a.startTime) >= Date.now())
      .sort((a,b) => Date.parse(a.startTime) - Date.parse(b.startTime))[0];
  }
  ngOnInit(): void { this.loadAppointments(); }
  loadAppointments(): void {
    this.loading = true; this.errorMessage = '';
    this.appointmentService.getAppointments().pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
      next: appointments => { this.appointments = appointments; this.loading = false; },
      error: () => { this.errorMessage = 'Could not load appointments. Please try again.'; this.loading = false; }
    });
  }
  get totalAppointments(): number { return this.appointments.length; }
  get pendingAppointments(): number { return this.appointments.filter(a => a.status === 'Pending').length; }
  get completedAppointments(): number { return this.appointments.filter(a => a.status === 'Completed').length; }
  get activeAppointments(): Appointment[] { return this.appointments.filter(a => ['Pending','Confirmed'].includes(a.status)); }
  get appointmentHistory(): Appointment[] { return this.appointments.filter(a => ['Completed','Cancelled','NoShow'].includes(a.status)); }
  private updateAppointment(id: number, request: () => Observable<unknown>, message: string): void {
    if (this.busyAppointments.has(id)) return;
    this.busyAppointments.add(id); this.actionMessage = '';
    request().pipe(timeout(20000), takeUntil(this.destroy$), finalize(() => this.busyAppointments.delete(id))).subscribe({
      next: () => { this.actionMessage = message; this.loadAppointments(); },
      error: error => { this.actionMessage = error.error?.message ?? 'Could not update this appointment. Please try again.'; }
    });
  }
  confirmAppointment(id: number): void { this.updateAppointment(id, () => this.appointmentService.confirmAppointment(id), 'Appointment confirmed. The patient has a notification.'); }
  completeAppointment(id: number): void { this.updateAppointment(id, () => this.appointmentService.completeAppointment(id), 'Appointment marked completed.'); }
  cancelAppointment(id: number): void { this.updateAppointment(id, () => this.appointmentService.cancelAppointment(id), 'Appointment cancelled.'); }
  markNoShow(id: number): void { this.updateAppointment(id, () => this.appointmentService.markNoShow(id), 'Appointment marked as no-show.'); }
  logout(): void { localStorage.removeItem('token'); void this.router.navigate(['/login']); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
