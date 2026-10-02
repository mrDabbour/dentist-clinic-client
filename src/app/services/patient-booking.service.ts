import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PATIENT_API_URL } from './patient-auth.service';

export interface BookingDentist {
  id: number; firstName: string; lastName: string; specialty: string; biography: string | null;
}
export interface BookingConfiguration {
  timeZone: string; minDate: string; maxDate: string; opensAt: string; closesAt: string;
  workingDays: string[]; slotIntervalMinutes: number;
}
export interface BookingSlot { startTime: string; endTime: string; }
export interface SlotsResponse { date: string; timeZone: string; slots: BookingSlot[]; }
export interface PatientBooking {
  id: number; patientId: number; patientName: string; dentistId: number; dentistName: string;
  dentalServiceId: number; serviceName: string; price: number; startTime: string; endTime: string;
  status: string; notes: string | null;
}
export interface BookingRequest { dentalServiceId: number; dentistId: number; startTime: string; notes: string | null; }

export interface PatientVisit {
  id: number; dentistId: number; dentistName: string; dentalServiceId: number; serviceName: string;
  price: number; startTime: string; endTime: string; status: string;
  invoice: { id: number; number: string; total: number; currency: string; paymentStatus: string; paymentMethod: string | null; paidAt: string | null } | null;
}
export interface MyAppointmentsPage {
  items: PatientVisit[]; page: number; pageSize: number; total: number; nextPage: number | null;
  counts: { upcoming: number; history: number; all: number }; timeZone: string;
}
@Injectable({ providedIn: 'root' })
export class PatientBookingService {
  private readonly apiUrl = PATIENT_API_URL.replace('/patient-auth', '/patient-booking');
  constructor(private http: HttpClient) {}
  getMyAppointments(view: string, page: number): Observable<MyAppointmentsPage> {
    const params = new HttpParams().set('view', view).set('page', page);
    return this.http.get<MyAppointmentsPage>(`${this.apiUrl}/appointments`, { params });
  }
  getConfiguration(): Observable<BookingConfiguration> { return this.http.get<BookingConfiguration>(`${this.apiUrl}/config`); }
  getDentists(): Observable<BookingDentist[]> { return this.http.get<BookingDentist[]>(`${this.apiUrl}/dentists`); }
  getSlots(dentalServiceId: number, dentistId: number, date: string): Observable<SlotsResponse> {
    const params = new HttpParams().set('dentalServiceId', dentalServiceId).set('dentistId', dentistId).set('date', date);
    return this.http.get<SlotsResponse>(`${this.apiUrl}/slots`, { params });
  }
  createBooking(request: BookingRequest): Observable<PatientBooking> { return this.http.post<PatientBooking>(`${this.apiUrl}/appointments`, request); }
  getBooking(id: number): Observable<PatientBooking> { return this.http.get<PatientBooking>(`${this.apiUrl}/appointments/${id}`); }
}
