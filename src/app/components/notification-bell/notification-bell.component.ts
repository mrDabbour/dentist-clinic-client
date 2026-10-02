import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, takeUntil, timer, timeout } from 'rxjs';
import { PatientAuthService } from '../../services/patient-auth.service';
import { BillingService, PatientNotification } from '../../services/billing.service';

@Component({ selector: 'app-notification-bell', templateUrl: './notification-bell.component.html', styleUrls: ['./notification-bell.component.css'] })
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: PatientNotification[] = [];
  panelOpen = false;
  signedIn = false;
  soundEnabled = false;
  errorMessage = '';
  openingId: number | null = null;
  private token: string | null = null;
  private seen = new Set<number>();
  private initialized = false;
  private audio?: AudioContext;
  private readonly destroy$ = new Subject<void>();
  constructor(private api: BillingService, private auth: PatientAuthService, private router: Router) {}
  get unreadCount(): number { return this.notifications.filter(n => !n.readAt).length; }
  get latestUnread(): PatientNotification | undefined { return this.notifications.find(n => !n.readAt); }
  ngOnInit(): void {
    timer(0, 5000).pipe(exhaustMap(() => {
      const token = this.auth.getToken();
      this.signedIn = !!token;
      if (token !== this.token) {
        this.token = token; this.notifications = []; this.seen.clear(); this.initialized = false;
        this.panelOpen = false; this.errorMessage = '';
      }
      if (!token) return EMPTY;
      return this.api.getNotifications().pipe(timeout(10000), catchError(() => {
        this.errorMessage = 'Updates delayed. Reconnecting...'; return EMPTY;
      }));
    }), takeUntil(this.destroy$)).subscribe(notifications => this.accept(notifications));
  }
  accept(notifications: PatientNotification[]): void {
    // Ignore responses from a session that ended while the request was in flight.
    if (!this.auth.getToken() || this.auth.getToken() !== this.token) return;
    const newUnread = notifications.some(n => !n.readAt && !this.seen.has(n.id));
    this.notifications = notifications;
    if (this.initialized && newUnread && this.soundEnabled) this.playChime();
    notifications.forEach(n => this.seen.add(n.id));
    this.initialized = true; this.errorMessage = '';
  }
  async toggleSound(): Promise<void> {
    if (this.soundEnabled) { this.soundEnabled = false; return; }
    try {
      this.audio ??= new AudioContext();
      await this.audio.resume(); this.soundEnabled = this.audio.state === 'running';
      if (this.soundEnabled) this.playChime();
    } catch { this.soundEnabled = false; this.errorMessage = 'Sound is unavailable in this browser.'; }
  }
  playChime(): void {
    if (!this.audio || this.audio.state !== 'running') return;
    const now = this.audio.currentTime;
    [659.25, 880, 1046.5].forEach((frequency, index) => {
      const start = now + index * .13;
      const tone = this.audio!.createOscillator(); const gain = this.audio!.createGain();
      tone.type = 'sine'; tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.12, start + .02);
      gain.gain.exponentialRampToValueAtTime(.001, start + .42);
      tone.connect(gain); gain.connect(this.audio!.destination); tone.start(start); tone.stop(start + .44);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    });
  }
  open(notification: PatientNotification): void {
    if (this.openingId !== null) return;
    this.openingId = notification.id;
    const navigate = () => { this.openingId = null; this.panelOpen = false;
      void this.router.navigate(['/book'], { queryParams: { appointment: notification.appointmentId } }); };
    this.api.markNotificationRead(notification.id).pipe(timeout(10000), takeUntil(this.destroy$)).subscribe({
      next: () => { notification.readAt ??= new Date().toISOString(); navigate(); },
      error: () => { this.errorMessage = 'Your notification is still unread. Please try opening it again.'; navigate(); }
    });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); if (this.audio) void this.audio.close(); }
}
