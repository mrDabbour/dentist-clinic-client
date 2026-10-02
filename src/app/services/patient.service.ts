import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  private apiUrl = 'http://localhost:8080/api/Patients';

  constructor(private http: HttpClient) { }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(
      `${this.apiUrl}/${id}`
    );
  }

  updatePatient(
    id: number,
    patient: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }
  ): Observable<Patient> {

    return this.http.put<Patient>(
      `${this.apiUrl}/${id}`,
      patient
    );
  }

  createPatient(patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }): Observable<Patient> {

    return this.http.post<Patient>(
      this.apiUrl,
      patient
    );
  }

}