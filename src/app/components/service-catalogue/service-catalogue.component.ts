import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, timeout } from 'rxjs';
import { DentalService } from '../../services/dental-service.service';
import { PATIENT_API_URL } from '../../services/patient-auth.service';

@Component({ selector: 'app-service-catalogue', templateUrl: './service-catalogue.component.html', styleUrls: ['./service-catalogue.component.css'] })
export class ServiceCatalogueComponent implements OnInit, OnDestroy {
  services: DentalService[] = [];
  search = ''; category = ''; loading = true; errorMessage = '';
  private readonly destroy$ = new Subject<void>();
  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.errorMessage = '';
    this.http.get<DentalService[]>(PATIENT_API_URL.replace('/patient-auth', '/public/services'))
      .pipe(timeout(15000), takeUntil(this.destroy$)).subscribe({
        next: services => { this.services = services; this.loading = false; },
        error: () => { this.errorMessage = 'Unable to load services. Please try again.'; this.loading = false; }
      });
  }
  get categories(): string[] { return [...new Set(this.services.map(s => s.category).filter(Boolean))].sort(); }
  get filteredServices(): DentalService[] {
    const search = this.search.trim().toLowerCase();
    return this.services.filter(s => (!this.category || s.category === this.category) &&
      `${s.name} ${s.description} ${s.category}`.toLowerCase().includes(search));
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
