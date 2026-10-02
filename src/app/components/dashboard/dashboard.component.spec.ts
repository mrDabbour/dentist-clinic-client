import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { Appointment, AppointmentService } from '../../services/appointment.service';
import { DashboardComponent } from './dashboard.component';

describe('Clinic workspace app launcher', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let api: jasmine.SpyObj<AppointmentService>;
  const appointment = { id: 1, patientName: 'Test Patient', status: 'Pending' } as Appointment;
  const token = (role: string) => `test.${btoa(JSON.stringify({ role }))}.test`;
  beforeEach(() => {
    localStorage.setItem('token', token('Admin'));
    api = jasmine.createSpyObj('AppointmentService', ['getAppointments', 'confirmAppointment', 'completeAppointment', 'cancelAppointment', 'markNoShow']);
    api.getAppointments.and.returnValue(of([appointment]));
    TestBed.configureTestingModule({ imports: [CommonModule, FormsModule, RouterTestingModule], declarations: [DashboardComponent],
      providers: [{ provide: AppointmentService, useValue: api }] });
    fixture = TestBed.createComponent(DashboardComponent); component = fixture.componentInstance; fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); localStorage.removeItem('token'); });
  it('connects each app card to its actual staff page', () => {
    const links = [...fixture.nativeElement.querySelectorAll('.app-card')] as HTMLAnchorElement[];
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/appointments', '/patients', '/dentists', '/services-management', '/billing']);
    expect(links[0].textContent).toContain('1 awaiting confirmation');
  });
  it('updates next-step guidance when a card receives keyboard focus', () => {
    const cards = fixture.nativeElement.querySelectorAll('.app-card'); cards[1].dispatchEvent(new Event('focus')); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#preview-heading').textContent).toBe('Patients');
    expect(fixture.nativeElement.querySelector('.open-app').getAttribute('href')).toBe('/patients');
    expect(api.getAppointments).toHaveBeenCalledTimes(1);
  });
  it('filters apps and offers recovery when no app matches', () => {
    component.appSearch = 'payments'; fixture.detectChanges(); expect(fixture.nativeElement.querySelectorAll('.app-card').length).toBe(1);
    component.appSearch = 'nothing-matches'; fixture.detectChanges(); expect(fixture.nativeElement.querySelector('.no-apps')).not.toBeNull();
    fixture.nativeElement.querySelector('.no-apps button').click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.app-card').length).toBe(5);
  });
  it('hides the payment app for staff without billing access', () => {
    localStorage.setItem('token', token('Dentist')); fixture.detectChanges();
    expect(component.availableApps.some(a => a.id === 'billing')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.app-card[href="/billing"]')).toBeNull();
  });
  it('shows unavailable data instead of a false zero after a failed request', () => {
    api.getAppointments.and.returnValue(throwError(() => new Error('offline'))); component.loadAppointments(); fixture.detectChanges();
    expect(component.appHint(component.apps[0])).toBe('Schedule unavailable');
    expect(fixture.nativeElement.querySelector('.summary-value').textContent.trim()).toBe('—');
  });
  it('prevents repeated appointment actions and reports confirmation to staff', () => {
    const response = new Subject<unknown>(); api.confirmAppointment.and.returnValue(response);
    component.confirmAppointment(1); component.confirmAppointment(1); expect(api.confirmAppointment).toHaveBeenCalledTimes(1);
    response.next({}); response.complete(); expect(component.busyAppointments.has(1)).toBeFalse();
    expect(component.actionMessage).toContain('patient has a notification');
  });
});
