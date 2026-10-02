import { convertToParamMap } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { InvoiceComponent } from './invoice.component';
import { BillingService, InvoiceResponse } from '../../services/billing.service';

describe('Invoice payment flow', () => {
  let api: jasmine.SpyObj<BillingService>;
  let component: InvoiceComponent;
  const response = (status = 'Unpaid'): InvoiceResponse => ({
    invoice: { id: 1, number: 'DC-000001', appointmentId: 42, customerName: 'Test Patient', customerEmail: 'test@example.test',
      supplierName: 'Clinic', supplierAddress: '', supplierGstNumber: 'TEST', description: 'Consultation', subtotal: 100,
      gstRate: .15, gstAmount: 15, total: 115, gstRegistered: true, currency: 'NZD', paymentStatus: status,
      paymentMethod: null, issuedAt: '', paidAt: null, bankTransferReference: null },
    canPay: true, payPalAvailable: true, bankAccountName: 'Test', bankAccountNumber: 'TEST' });
  const init = (query = {}) => {
    component = new InvoiceComponent(api, { snapshot: { paramMap: convertToParamMap({ appointmentId: '42' }),
      queryParamMap: convertToParamMap(query) } } as any, { navigate: jasmine.createSpy().and.resolveTo(true) } as any);
    component.ngOnInit();
  };
  beforeEach(() => {
    api = jasmine.createSpyObj('BillingService', ['getInvoice', 'reportBankTransfer', 'createPayPalOrder', 'capturePayPalOrder']);
    api.getInvoice.and.returnValue(of(response()));
  });
  afterEach(() => component?.ngOnDestroy());
  it('keeps bank transfers awaiting verification', () => {
    api.reportBankTransfer.and.returnValue(of(response('AwaitingVerification'))); init(); component.reportTransfer();
    expect(api.reportBankTransfer).toHaveBeenCalledWith(1, 'DC-000001');
    expect(component.data!.invoice.paymentStatus).toBe('AwaitingVerification');
    expect(component.data!.invoice.paidAt).toBeNull();
  });
  it('does not treat a PayPal redirect as payment evidence', () => {
    const pending = new Subject<InvoiceResponse>(); api.capturePayPalOrder.and.returnValue(pending);
    init({ paypal: 'return', token: 'ORDER-1' });
    expect(api.capturePayPalOrder).toHaveBeenCalledWith(1, 'ORDER-1');
    expect(component.data!.invoice.paymentStatus).toBe('Unpaid');
    pending.next(response('Paid')); expect(component.data!.invoice.paymentStatus).toBe('Paid');
  });
  it('keeps unpaid state when PayPal verification fails', () => {
    api.capturePayPalOrder.and.returnValue(throwError(() => ({ error: { message: 'Payment amount mismatch.' } })));
    init({ paypal: 'return', token: 'FORGED' });
    expect(component.data!.invoice.paymentStatus).toBe('Unpaid'); expect(component.errorMessage).toContain('mismatch');
  });
  it('blocks reporting another transfer after payment', () => {
    api.getInvoice.and.returnValue(of(response('Paid'))); init(); component.reportTransfer();
    expect(api.reportBankTransfer).not.toHaveBeenCalled();
  });
  it('identifies missing clinic setup without treating it as a temporary outage', () => {
    api.getInvoice.and.returnValue(throwError(() => ({ status: 409, error: {
      code: 'BILLING_SETUP_REQUIRED', message: 'The clinic has not completed its invoice setup.' } })));
    init();
    expect(component.billingSetupRequired).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.data).toBeNull();
    expect(component.errorMessage).toContain('invoice setup');
  });
});
