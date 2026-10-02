import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PATIENT_API_URL } from './patient-auth.service';

export interface Invoice {
  id: number; number: string; appointmentId: number; customerName: string; customerEmail: string;
  supplierName: string; supplierAddress: string; supplierGstNumber: string | null;
  description: string; subtotal: number; gstRate: number; gstAmount: number; total: number;
  gstRegistered: boolean; currency: string; paymentStatus: string; paymentMethod: string | null;
  issuedAt: string; paidAt: string | null; bankTransferReference: string | null;
}
export interface InvoiceResponse { invoice: Invoice; canPay: boolean; payPalAvailable: boolean; bankAccountName: string; bankAccountNumber: string; }
export interface PatientNotification { id: number; appointmentId: number; message: string; createdAt: string; readAt: string | null; }

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly api = PATIENT_API_URL.replace('/patient-auth', '');
  constructor(private http: HttpClient) {}
  getInvoice(appointmentId: number): Observable<InvoiceResponse> { return this.http.post<InvoiceResponse>(`${this.api}/billing/appointments/${appointmentId}/invoice`, {}); }
  reportBankTransfer(id: number, reference: string): Observable<InvoiceResponse> { return this.http.post<InvoiceResponse>(`${this.api}/billing/invoices/${id}/bank-transfer`, { reference }); }
  createPayPalOrder(id: number): Observable<{ orderId: string; approvalUrl: string }> { return this.http.post<{ orderId: string; approvalUrl: string }>(`${this.api}/billing/invoices/${id}/paypal-order`, {}); }
  capturePayPalOrder(id: number, orderId: string): Observable<InvoiceResponse> { return this.http.post<InvoiceResponse>(`${this.api}/billing/invoices/${id}/paypal-capture`, { orderId }); }
  getNotifications(): Observable<PatientNotification[]> { return this.http.get<PatientNotification[]>(`${this.api}/patient-notifications`); }
  markNotificationRead(id: number): Observable<void> { return this.http.patch<void>(`${this.api}/patient-notifications/${id}/read`, {}); }
  getStaffInvoices(): Observable<Invoice[]> { return this.http.get<Invoice[]>(`${this.api}/billing/staff/invoices`); }
  verifyBankPayment(id: number, verificationReference: string): Observable<InvoiceResponse> { return this.http.post<InvoiceResponse>(`${this.api}/billing/invoices/${id}/verify-bank-payment`, { verificationReference }); }
}
