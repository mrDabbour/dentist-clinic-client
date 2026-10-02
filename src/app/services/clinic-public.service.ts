import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { PATIENT_API_URL } from './patient-auth.service';
export interface ClinicInfo {
  name: string; email: string; phone: string; telephoneLink: string;
  opensAt: string; closesAt: string; workingDays: string[]; timeZone: string;
  figures: { patientsHelped: number; completedVisits: number; activeDentists: number; availableServices: number };
  reviews: { author: string; quote: string }[];
}
export interface PublicDoctor { id: number; firstName: string; lastName: string; specialty: string; biography: string | null; }
@Injectable({ providedIn: 'root' })
export class ClinicPublicService {
  private readonly api = PATIENT_API_URL.replace('/patient-auth', '/public/clinic');
  constructor(private http: HttpClient) {}
  getInfo(): Observable<ClinicInfo> { return this.http.get<ClinicInfo>(this.api).pipe(timeout(15000)); }
  getTeam(): Observable<PublicDoctor[]> { return this.http.get<PublicDoctor[]>(`${this.api}/team`).pipe(timeout(15000)); }
  formatTime(value: string): string { const [h,m] = value.split(':'); const hour = Number(h); return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`; }
}
