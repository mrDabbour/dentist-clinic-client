import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicPublicService, PublicDoctor } from '../../services/clinic-public.service';
@Component({ selector: 'app-team', templateUrl: './team.component.html', styleUrls: ['../public-pages.css'] })
export class TeamComponent implements OnInit, OnDestroy {
  doctors: PublicDoctor[] = []; loading = true; errorMessage = ''; expanded = new Set<number>();
  private readonly destroy$ = new Subject<void>();
  constructor(private api: ClinicPublicService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.loading = true; this.errorMessage = ''; this.api.getTeam().pipe(takeUntil(this.destroy$)).subscribe({
    next: doctors => { this.doctors = doctors; this.loading = false; },
    error: () => { this.loading = false; this.errorMessage = 'Unable to load the clinical team. Please try again.'; }
  }); }
  toggle(id: number): void { this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id); }
  initials(doctor: PublicDoctor): string { return `${doctor.firstName.charAt(0)}${doctor.lastName.charAt(0)}`.toUpperCase(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
