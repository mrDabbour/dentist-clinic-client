import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil, timeout } from 'rxjs';
import { BillingService, Invoice } from '../../services/billing.service';
@Component({ selector: 'app-staff-billing', templateUrl: './staff-billing.component.html', styleUrls: ['./staff-billing.component.css'] })
export class StaffBillingComponent implements OnInit, OnDestroy {
  invoices: Invoice[] = []; reference: Partial<Record<number, string>> = {}; errorMessage = ''; isLoading = true; busyId: number | null = null;
  private readonly destroy$ = new Subject<void>();
  constructor(private api: BillingService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.isLoading = true; this.api.getStaffInvoices().pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
    next: invoices => { this.invoices = invoices; this.isLoading = false; }, error: () => { this.isLoading = false; this.errorMessage = 'Unable to load invoices. Admin or receptionist access is required.'; }
  }); }
  verify(invoice: Invoice): void {
    if (this.busyId !== null || !this.reference[invoice.id]?.trim()) return;
    this.busyId = invoice.id; this.errorMessage = '';
    this.api.verifyBankPayment(invoice.id, this.reference[invoice.id]!.trim()).pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
      next: response => { Object.assign(invoice, response.invoice); this.busyId = null; },
      error: error => { this.busyId = null; this.errorMessage = error.error?.message ?? 'Unable to verify payment.'; }
    });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
