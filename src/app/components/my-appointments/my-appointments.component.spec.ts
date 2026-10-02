import { fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { MyAppointmentsComponent } from './my-appointments.component';
import { MyAppointmentsPage, PatientVisit } from '../../services/patient-booking.service';
import { safePatientReturnUrl } from '../../services/patient-navigation';
import { convertToParamMap } from '@angular/router';
import { PatientProfileComponent } from '../patient-profile/patient-profile.component';

describe('Patient appointment workspace', () => {
  const visit = { id: 74, status: 'Confirmed', serviceName: 'Check-up', invoice: null } as PatientVisit;
  const page = (items: PatientVisit[]): MyAppointmentsPage => ({ items, page: 1, pageSize: 10, total: items.length,
    nextPage: null, counts: { upcoming: items.length, history: 0, all: items.length }, timeZone: 'Pacific/Auckland' });
  it('refreshes payment status and loads the requested view from page one', fakeAsync(() => {
    const api = { getMyAppointments: jasmine.createSpy().and.returnValue(of(page([visit]))) };
    const component = new MyAppointmentsComponent(api as any, {} as any, {} as any);
    component.ngOnInit(); tick(0); expect(api.getMyAppointments).toHaveBeenCalledWith('upcoming', 1);
    tick(15000); expect(api.getMyAppointments).toHaveBeenCalledTimes(2);
    component.changeView('history'); expect(api.getMyAppointments).toHaveBeenCalledWith('history', 1);
    component.ngOnDestroy();
  }));
  it('cancels stale requests when the patient switches appointment views', fakeAsync(() => {
    const old = new Subject<MyAppointmentsPage>(); const recent = new Subject<MyAppointmentsPage>();
    const api = { getMyAppointments: jasmine.createSpy().and.returnValues(old, recent) };
    const component = new MyAppointmentsComponent(api as any, {} as any, {} as any);
    component.ngOnInit(); tick(0); component.changeView('history'); recent.next(page([])); old.next(page([visit]));
    expect(component.data!.items).toEqual([]); component.ngOnDestroy();
  }));
  it('distinguishes paid receipts, unverified transfers and pending bookings', () => {
    const component = new MyAppointmentsComponent({} as any, {} as any, {} as any);
    expect(component.paymentLabel({ ...visit, invoice: { paymentStatus: 'AwaitingVerification' } as any })).toBe('Awaiting bank verification');
    expect(component.paymentLabel({ ...visit, invoice: { paymentStatus: 'Paid' } as any })).toBe('Paid');
    expect(component.canOpenPayment({ ...visit, status: 'Pending' })).toBeFalse();
    expect(component.canOpenPayment({ ...visit, status: 'Cancelled', invoice: { paymentStatus: 'Paid' } as any })).toBeTrue();
    component.ngOnDestroy();
  });
  it('preserves selected service and dentist while refusing unsafe destinations', () => {
    expect(safePatientReturnUrl('/book?service=1&dentist=2')).toBe('/book?service=1&dentist=2');
    expect(safePatientReturnUrl('/my-appointments')).toBe('/my-appointments');
    for (const url of ['https://example.com', '//example.com', '/\\example.com', '/dashboard', 'javascript:alert(1)']) {
      expect(safePatientReturnUrl(url)).toBe('/book');
    }
  });
  it('preserves the booking destination when the patient completes their phone profile', () => {
    const router = { navigateByUrl: jasmine.createSpy().and.resolveTo(true) };
    const component = new PatientProfileComponent({ updateProfile: () => of({}) } as any, router as any,
      { snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/book?service=1&dentist=2' }) } } as any);
    component.isLoading = false; component.phone = '0225974228'; component.continue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/book?service=1&dentist=2'); component.ngOnDestroy();
  });
});
