import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DentalService } from './dental-service.service';

export const PATIENT_API_URL = 'http://localhost:8080/api/patient-auth';
export interface PatientProfile {
  patientId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  requiresProfileCompletion: boolean;
}
export interface PatientAuthResponse extends PatientProfile {
  role: 'Patient';
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class PatientAuthService {
  constructor(private http: HttpClient) {}

  getConfiguration(): Observable<{ clientId: string }> {
    return this.http.get<{ clientId: string }>(`${PATIENT_API_URL}/config`);
  }

  loginWithGoogle(idToken: string): Observable<PatientAuthResponse> {
    return this.http.post<PatientAuthResponse>(`${PATIENT_API_URL}/google`, { idToken })
      .pipe(tap(auth => this.saveSession(auth)));
  }

  saveSession(auth: PatientAuthResponse): void {
    this.logout();
    sessionStorage.setItem('patient_token', auth.token);
    sessionStorage.setItem('patient_expires_at', auth.expiresAt);
    this.saveProfile(auth);
  }

  saveProfile(profile: PatientProfile): void {
    sessionStorage.setItem('patient_profile', JSON.stringify({
      patientId: profile.patientId, firstName: profile.firstName,
      lastName: profile.lastName, email: profile.email, phone: profile.phone,
      requiresProfileCompletion: profile.requiresProfileCompletion
    }));
  }

  getToken(): string | null {
    const expiresAt = Date.parse(sessionStorage.getItem('patient_expires_at') ?? '');
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      this.logout();
      return null;
    }
    return sessionStorage.getItem('patient_token');
  }

  getProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(`${PATIENT_API_URL}/me`)
      .pipe(tap(profile => this.saveProfile(profile)));
  }

  updateProfile(phone: string): Observable<PatientProfile> {
    return this.http.put<PatientProfile>(`${PATIENT_API_URL}/profile`, { phone })
      .pipe(tap(profile => this.saveProfile(profile)));
  }

  getAvailableServices(): Observable<DentalService[]> {
    return this.http.get<DentalService[]>(`${PATIENT_API_URL}/services`);
  }

  logout(): void {
    for (const key of ['patient_token', 'patient_profile', 'patient_expires_at']) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key); // Remove tokens persisted by the previous implementation.
    }
  }
}
