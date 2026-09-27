import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
  id: number;

  patientId: number;
  patientName: string;

  dentistId: number;
  dentistName: string;

  dentalServiceId: number;
  dentalServiceName: string;

  price: number;

  startTime: string;
  endTime: string;

  status: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private apiUrl = 'http://localhost:8080/api/Appointments';

  constructor(private http: HttpClient) { }

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  confirmAppointment(id: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/confirm`,
      {}
    );
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );
  }

  completeAppointment(id: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/complete`,
      {}
    );
  }

  markNoShow(id: number): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/no-show`,
      {}
    );
  }
}


