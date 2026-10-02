import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ClinicInfo, ClinicPublicService } from '../../services/clinic-public.service';
@Component({ selector: 'app-contact', templateUrl: './contact.component.html', styleUrls: ['../public-pages.css'] })
export class ContactComponent implements OnInit, OnDestroy {
  clinic: ClinicInfo | null = null;
  readonly email = 'mohammeddabboornz@gmail.com'; readonly phone = '022 597 4228';
  private readonly destroy$ = new Subject<void>();
  constructor(public api: ClinicPublicService) {}
  ngOnInit(): void { this.api.getInfo().pipe(takeUntil(this.destroy$)).subscribe({ next: clinic => this.clinic = clinic, error: () => {} }); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
