import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Dentist {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DentistService {

  private apiUrl = 'http://localhost:8080/api/Dentists';

  constructor(private http: HttpClient) { }

  getDentists(): Observable<Dentist[]> {
    return this.http.get<Dentist[]>(this.apiUrl);
  }
}