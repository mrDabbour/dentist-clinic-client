import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, timeout } from 'rxjs';
import { BillingService, InvoiceResponse } from '../../services/billing.service';

@Component({ selector: 'app-invoice', templateUrl: './invoice.component.html', styleUrls: ['./invoice.component.css'] })
export class InvoiceComponent implements OnInit, OnDestroy {
  data: InvoiceResponse | null = null;
  isLoading = true;
  isPaying = false;
  errorMessage = '';
  billingSetupRequired = false;
  message = '';
  bankReference = '';
  private readonly destroy$ = new Subject<void>();
  constructor(private api: BillingService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    const appointmentId = Number(this.route.snapshot.paramMap.get('appointmentId'));
    if (!Number.isInteger(appointmentId) || appointmentId < 1) { this.isLoading = false; this.errorMessage = 'Invoice not found.'; return; }
    this.isLoading = true; this.errorMessage = ''; this.billingSetupRequired = false;
    this.api.getInvoice(appointmentId).pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.data = data; this.bankReference = data.invoice.number; this.isLoading = false;
        const params = this.route.snapshot.queryParamMap;
        if (params.get('paypal') === 'return' && params.get('token') && data.invoice.paymentStatus !== 'Paid') this.capture(params.get('token')!);
        if (params.get('paypal') === 'cancel') this.message = 'PayPal checkout was cancelled. Your invoice remains unpaid.';
      }, error: error => { this.isLoading = false; this.billingSetupRequired = error.error?.code === 'BILLING_SETUP_REQUIRED'; this.errorMessage = error.error?.message ?? 'Unable to load your invoice. Please try again.'; }
    });
  }
  payWithPayPal(): void {
    if (!this.data || this.isPaying || !this.data.canPay || !this.data.payPalAvailable || this.data.invoice.paymentStatus !== 'Unpaid') return;
    this.isPaying = true; this.errorMessage = '';
    this.api.createPayPalOrder(this.data.invoice.id).pipe(timeout(30000), takeUntil(this.destroy$)).subscribe({
      next: result => {
        const url = new URL(result.approvalUrl);
        if (url.protocol !== 'https:' || !['www.paypal.com', 'www.sandbox.paypal.com'].includes(url.hostname)) {
          this.isPaying = false; this.errorMessage = 'Unable to open PayPal checkout.'; return;
        }
        window.location.assign(result.approvalUrl);
      }, error: error => { this.isPaying = false; this.errorMessage = error.error?.message ?? 'PayPal is unavailable. Please try again later.'; }
    });
  }
  capture(orderId: string): void {
    if (!this.data || this.isPaying) return;
    this.isPaying = true; this.message = 'Checking your PayPal payment...';
    this.api.capturePayPalOrder(this.data.invoice.id, orderId).pipe(timeout(60000), takeUntil(this.destroy$)).subscribe({
      next: data => { this.data = data; this.isPaying = false; this.message = 'Payment received. Thank you.'; this.clearPaymentQuery(); },
      error: error => { this.isPaying = false; this.message = ''; this.errorMessage = error.error?.message ?? 'Unable to verify your payment yet. Please refresh or contact the clinic.'; }
    });
  }
  reportTransfer(): void {
    if (!this.data || this.isPaying || !this.bankReference.trim() || this.data.invoice.paymentStatus !== 'Unpaid') return;
    this.isPaying = true; this.errorMessage = '';
    this.api.reportBankTransfer(this.data.invoice.id, this.bankReference.trim()).pipe(timeout(20000), takeUntil(this.destroy$)).subscribe({
      next: data => { this.data = data; this.isPaying = false; this.message = 'Transfer reported. The clinic will verify it against its bank records.'; },
      error: error => { this.isPaying = false; this.errorMessage = error.error?.message ?? 'Unable to report your transfer. Please try again.'; }
    });
  }
  print(): void { window.print(); }
  private clearPaymentQuery(): void { void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true }); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
