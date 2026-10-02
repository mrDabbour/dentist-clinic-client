import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Dentist {
  id: number;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  registrationNumber: string;
  specialty: string;

  biography?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateDentist {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  registrationNumber: string;
  specialty: string;

  biography?: string;
}

export interface UpdateDentist {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  registrationNumber: string;
  specialty: string;

  biography?: string;

  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DentistService {

  private apiUrl =
    'http://localhost:8080/api/Dentists';

  constructor(
    private http: HttpClient
  ) { }

  getDentists(): Observable<Dentist[]> {

    return this.http.get<Dentist[]>(
      this.apiUrl
    );
  }

  getDentist(
    id: number
  ): Observable<Dentist> {

    return this.http.get<Dentist>(
      `${this.apiUrl}/${id}`
    );
  }

  createDentist(
    dentist: CreateDentist
  ): Observable<Dentist> {

    return this.http.post<Dentist>(
      this.apiUrl,
      dentist
    );
  }

  updateDentist(
    id: number,
    dentist: UpdateDentist
  ): Observable<Dentist> {

    return this.http.put<Dentist>(
      `${this.apiUrl}/${id}`,
      dentist
    );
  }

  deleteDentist(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}