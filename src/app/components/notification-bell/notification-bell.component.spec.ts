import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { BillingService, PatientNotification } from '../../services/billing.service';
import { PatientAuthService } from '../../services/patient-auth.service';

describe('Persistent patient notification bell', () => {
  let component: NotificationBellComponent;
  let api: jasmine.SpyObj<BillingService>;
  let auth: jasmine.SpyObj<PatientAuthService>;
  let router: any;
  const notification = (id = 1, readAt: string | null = null): PatientNotification => ({ id, appointmentId: 74,
    message: 'Your appointment is confirmed.', createdAt: '2026-10-01T05:00:00Z', readAt });
  beforeEach(() => {
    api = jasmine.createSpyObj('BillingService', ['getNotifications', 'markNotificationRead']);
    auth = jasmine.createSpyObj('PatientAuthService', ['getToken']); auth.getToken.and.returnValue('patient-token');
    api.getNotifications.and.returnValue(of([notification()])); api.markNotificationRead.and.returnValue(of(undefined));
    router = { navigate: jasmine.createSpy().and.resolveTo(true) }; component = new NotificationBellComponent(api, auth, router);
  });
  afterEach(() => component.ngOnDestroy());
  it('keeps the red count and alert until a notification is opened', fakeAsync(() => {
    component.ngOnInit(); tick(0); expect(component.unreadCount).toBe(1);
    component.panelOpen = true; component.panelOpen = false; tick(15000);
    expect(component.unreadCount).toBe(1); expect(component.latestUnread?.id).toBe(1);
    expect(api.markNotificationRead).not.toHaveBeenCalled();
    component.open(component.notifications[0]);
    expect(component.unreadCount).toBe(0); expect(component.notifications.length).toBe(1);
    expect(router.navigate).toHaveBeenCalledWith(['/book'], { queryParams: { appointment: 74 } });
    component.ngOnDestroy();
  }));
  it('sounds once for a newly confirmed booking and does not repeat on polling', fakeAsync(() => {
    const chime = spyOn(component, 'playChime'); component.soundEnabled = true;
    component.ngOnInit(); tick(0); expect(chime).not.toHaveBeenCalled();
    api.getNotifications.and.returnValue(of([notification(2), notification(1)])); tick(5000);
    expect(chime).toHaveBeenCalledTimes(1); expect(component.unreadCount).toBe(2);
    tick(10000); expect(chime).toHaveBeenCalledTimes(1); component.ngOnDestroy();
  }));
  it('preserves unread notifications after a connection failure and retries', fakeAsync(() => {
    component.ngOnInit(); tick(0);
    api.getNotifications.and.returnValue(throwError(() => new Error('offline'))); tick(5000);
    expect(component.unreadCount).toBe(1);
    api.getNotifications.and.returnValue(of([notification(2), notification(1)])); tick(5000);
    expect(component.unreadCount).toBe(2); expect(component.errorMessage).toBe(''); component.ngOnDestroy();
  }));
  it('leaves a notification unread if marking it read fails', fakeAsync(() => {
    component.ngOnInit(); tick(0); api.markNotificationRead.and.returnValue(throwError(() => new Error('offline')));
    component.open(component.notifications[0]); expect(component.unreadCount).toBe(1); component.ngOnDestroy();
  }));
  it('clears patient data when signed out and does not poll anonymously', fakeAsync(() => {
    component.ngOnInit(); tick(0); api.getNotifications.calls.reset(); auth.getToken.and.returnValue(null); tick(5000);
    expect(component.signedIn).toBeFalse(); expect(component.unreadCount).toBe(0);
    expect(api.getNotifications).not.toHaveBeenCalled(); component.ngOnDestroy();
  }));
});
