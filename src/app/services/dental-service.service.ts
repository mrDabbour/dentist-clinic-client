import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface DentalService {

  id: number;

  name: string;

  category: string;

  description: string;

  price: number;

  durationMinutes: number;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}


export interface CreateDentalService {

  name: string;

  category: string;

  description: string;

  price: number;

  durationMinutes: number;
}


export interface UpdateDentalService {

  name: string;

  category: string;

  description: string;

  price: number;

  durationMinutes: number;

  isActive: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class DentalServiceService {

  private apiUrl =
    'http://localhost:8080/api/DentalServices';


  constructor(
    private http: HttpClient
  ) { }


  // GET ALL
  getDentalServices():
    Observable<DentalService[]> {

    return this.http.get<DentalService[]>(
      this.apiUrl
    );
  }


  // GET ONE
  getDentalService(
    id: number
  ): Observable<DentalService> {

    return this.http.get<DentalService>(
      `${this.apiUrl}/${id}`
    );
  }


  // CREATE
  createDentalService(
    service: CreateDentalService
  ): Observable<DentalService> {

    return this.http.post<DentalService>(
      this.apiUrl,
      service
    );
  }


  // UPDATE
  updateDentalService(
    id: number,
    service: UpdateDentalService
  ): Observable<DentalService> {

    return this.http.put<DentalService>(
      `${this.apiUrl}/${id}`,
      service
    );
  }


  // SOFT DELETE / DEACTIVATE
  deactivateDentalService(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}