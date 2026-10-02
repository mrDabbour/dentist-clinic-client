import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicInfo, ClinicPublicService } from '../../services/clinic-public.service';
@Component({ selector: 'app-about', templateUrl: './about.component.html', styleUrls: ['../public-pages.css'] })
export class AboutComponent implements OnInit, OnDestroy {
  clinic: ClinicInfo | null = null; loading = true; errorMessage = '';
  private readonly destroy$ = new Subject<void>();
  constructor(private api: ClinicPublicService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.errorMessage = ''; this.api.getInfo().pipe(takeUntil(this.destroy$)).subscribe({
    next: clinic => { this.clinic = clinic; this.loading = false; },
    error: () => { this.loading = false; this.errorMessage = 'Clinic figures are unavailable right now.'; }
  }); }
  get figures(): { value: number; label: string }[] {
    if (!this.clinic) return [];
    const f = this.clinic.figures;
    return [{ value: f.patientsHelped, label: 'Patients with completed visits' }, { value: f.completedVisits, label: 'Completed appointments' },
      { value: f.activeDentists, label: 'Active dentists' }, { value: f.availableServices, label: 'Available services' }];
  }
  trackFigure(_index: number, figure: { label: string }): string { return figure.label; }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
