import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-staff-layout',
  templateUrl: './staff-layout.component.html',
  styleUrls: ['./staff-layout.component.css']
})
export class StaffLayoutComponent implements OnInit, OnDestroy {
  isNavigating = false;
  private readonly destroy$ = new Subject<void>();
  get currentApp(): string {
    const path = this.router.url.split(/[?#]/)[0].split('/')[1];
    const names: Record<string,string> = { dashboard: 'Dashboard', appointments: 'Appointments', patients: 'Patients', dentists: 'Dentists', 'services-management': 'Services', billing: 'Invoices & payments' };
    return names[path] ?? 'Clinic app';
  }
  ngOnInit(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationStart) this.isNavigating = true;
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) this.isNavigating = false;
      if (event instanceof NavigationEnd) window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  constructor(
    private router: Router
  ) { }

  get canViewBilling(): boolean {
    try {
      const encoded = (localStorage.getItem('token') ?? '').split('.')[1];
      const claims = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
      const role = claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? claims['role'];
      return role === 'Admin' || role === 'Receptionist';
    } catch { return false; }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
