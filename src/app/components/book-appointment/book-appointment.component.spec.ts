import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { BookAppointmentComponent } from './book-appointment.component';
import { PatientAuthService } from '../../services/patient-auth.service';
import { PatientBookingService, PatientBooking, SlotsResponse } from '../../services/patient-booking.service';

describe('BookAppointmentComponent booking journey', () => {
  let fixture: ComponentFixture<BookAppointmentComponent>;
  let component: BookAppointmentComponent;
  let api: jasmine.SpyObj<PatientBookingService>;
  let auth: jasmine.SpyObj<PatientAuthService>;
  const slot = { startTime: '2026-10-04T20:00:00Z', endTime: '2026-10-04T21:00:00Z' };
  const booking: PatientBooking = { id: 42, patientId: 1, patientName: 'Test Patient', dentistId: 1,
    dentistName: 'Test Dentist', dentalServiceId: 1, serviceName: 'Check-up', price: 120,
    ...slot, status: 'Pending', notes: null };
  beforeEach(() => {
    auth = jasmine.createSpyObj('PatientAuthService', ['getAvailableServices', 'getProfile', 'logout']);
    api = jasmine.createSpyObj('PatientBookingService', ['getConfiguration', 'getDentists', 'getSlots', 'createBooking', 'getBooking']);
    auth.getAvailableServices.and.returnValue(of([{ id: 1, name: 'Check-up', category: 'General', description: 'Check-up', price: 120,
      durationMinutes: 60, isActive: true, createdAt: '', updatedAt: '' }]));
    auth.getProfile.and.returnValue(of({ patientId: 1, firstName: 'Test', lastName: 'Patient', email: 'test@gmail.com',
      phone: '0211234567', requiresProfileCompletion: false }));
    api.getConfiguration.and.returnValue(of({ timeZone: 'Pacific/Auckland', minDate: '2026-10-05', maxDate: '2027-01-03',
      opensAt: '09:00', closesAt: '17:00', workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], slotIntervalMinutes: 15 }));
    api.getDentists.and.returnValue(of([{ id: 1, firstName: 'Test', lastName: 'Dentist', specialty: 'General', biography: null }]));
    api.getSlots.and.returnValue(of({ date: '2026-10-05', timeZone: 'Pacific/Auckland', slots: [slot] }));
    api.createBooking.and.returnValue(of(booking));
    TestBed.configureTestingModule({ imports: [CommonModule, FormsModule, RouterTestingModule], declarations: [BookAppointmentComponent],
      providers: [{ provide: PatientAuthService, useValue: auth }, { provide: PatientBookingService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } }] });
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(BookAppointmentComponent); component = fixture.componentInstance; fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());
  function reachReview(): void {
    component.selectService(component.services[0]); component.next();
    component.selectDentist(component.dentists[0]); component.next();
    component.selectSlot(component.slots[0]); component.next();
  }
  it('blocks advancing without a selection', () => { component.next(); expect(component.step).toBe(1); });
  it('preselects a service and dentist carried through sign-in without creating a booking', () => {
    (TestBed.inject(ActivatedRoute).snapshot as any).queryParamMap = convertToParamMap({ service: '1', dentist: '1' });
    component.loadJourney(); expect(component.selectedService?.id).toBe(1); expect(component.selectedDentist?.id).toBe(1);
    expect(component.step).toBe(3); expect(api.getSlots).toHaveBeenCalledWith(1, 1, '2026-10-05');
    expect(api.createBooking).not.toHaveBeenCalled();
  });
  it('completes all four steps and sends a request without a client-supplied patient ID', () => {
    reachReview(); expect(component.step).toBe(4); component.notes = ' Please call ';
    component.submit(); fixture.detectChanges();
    expect(api.createBooking).toHaveBeenCalledWith({ dentalServiceId: 1, dentistId: 1, startTime: slot.startTime, notes: 'Please call' });
    expect(fixture.nativeElement.textContent).toContain('Awaiting confirmation');
    expect(fixture.nativeElement.textContent).toContain('Booking request #42');
  });
  it('keeps selections when going back for review edits', () => {
    reachReview(); component.goToStep(2); expect(component.selectedService?.id).toBe(1); expect(component.selectedDentist?.id).toBe(1);
  });
  it('clears downstream choices when changing service', () => {
    reachReview(); component.goToStep(1); component.selectService({ ...component.services[0], id: 2 });
    expect(component.selectedDentist).toBeNull(); expect(component.selectedSlot).toBeNull();
  });
  it('returns to date selection when another patient books the slot', () => {
    api.createBooking.and.returnValue(throwError(() => ({ status: 409 }))); reachReview(); component.submit();
    expect(component.step).toBe(3); expect(component.selectedSlot).toBeNull(); expect(component.errorMessage).toContain('choose another');
  });
  it('prevents double submission while the request is pending', () => {
    const response = new Subject<PatientBooking>(); api.createBooking.and.returnValue(response); reachReview();
    component.submit(); component.submit(); expect(api.createBooking).toHaveBeenCalledTimes(1);
    response.next(booking); response.complete(); component.submit(); expect(api.createBooking).toHaveBeenCalledTimes(1);
  });
  it('discards old availability responses after changing date', () => {
    const first = new Subject<SlotsResponse>(); const second = new Subject<SlotsResponse>();
    api.getSlots.and.returnValues(first, second); component.selectService(component.services[0]); component.next();
    component.selectDentist(component.dentists[0]); component.next(); component.selectedDate = '2026-10-06'; component.loadSlots();
    first.next({ date: '2026-10-05', timeZone: 'Pacific/Auckland', slots: [slot] }); expect(component.slots.length).toBe(0);
    second.next({ date: '2026-10-06', timeZone: 'Pacific/Auckland', slots: [] }); expect(component.slots.length).toBe(0);
  });
  it('shows a styled sign-out button and clears the patient session', () => {
    const button = fixture.nativeElement.querySelector('.sign-out-button') as HTMLButtonElement;
    expect(button.textContent).toContain('Sign out'); button.click(); expect(auth.logout).toHaveBeenCalled();
  });
});
