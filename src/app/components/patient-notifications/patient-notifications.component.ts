import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, takeUntil, timer, timeout } from 'rxjs';
import { BillingService, PatientNotification } from '../../services/billing.service';

@Component({ selector: 'app-patient-notifications', templateUrl: './patient-notifications.component.html', styleUrls: ['./patient-notifications.component.css'] })
export class PatientNotificationsComponent implements OnInit, OnDestroy {
  notifications: PatientNotification[] = [];
  isLoading = true;
  errorMessage = '';
  private readonly destroy$ = new Subject<void>();
  constructor(private api: BillingService, private router: Router) {}
  ngOnInit(): void { timer(0, 20000).pipe(exhaustMap(() => this.api.getNotifications().pipe(timeout(15000), catchError(() => { this.isLoading = false; this.errorMessage = 'Unable to load notifications. Retrying shortly...'; return EMPTY; }))), takeUntil(this.destroy$)).subscribe({
    next: notifications => { this.notifications = notifications; this.isLoading = false; this.errorMessage = ''; },
    error: () => { this.isLoading = false; this.errorMessage = 'Unable to load notifications. Please refresh and try again.'; }
  }); }
  open(notification: PatientNotification): void {
    this.api.markNotificationRead(notification.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => { notification.readAt ??= new Date().toISOString();
      void this.router.navigate(['/book'], { queryParams: { appointment: notification.appointmentId } });
    }, error: () => { void this.router.navigate(['/book'], { queryParams: { appointment: notification.appointmentId } }); } });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
