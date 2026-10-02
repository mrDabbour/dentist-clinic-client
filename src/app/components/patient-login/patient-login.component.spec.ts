import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PatientLoginComponent } from './patient-login.component';
import { PatientAuthService } from '../../services/patient-auth.service';

describe('PatientLoginComponent', () => {
  let fixture: ComponentFixture<PatientLoginComponent>;
  let auth: jasmine.SpyObj<PatientAuthService>;
  let router: Router;
  let callback: (response: { credential?: string }) => void;
  let originalGoogle: Window['google'];

  beforeEach(() => {
    originalGoogle = window.google;
    auth = jasmine.createSpyObj('PatientAuthService', ['getToken', 'getConfiguration', 'loginWithGoogle', 'getProfile', 'logout']);
    auth.getToken.and.returnValue(null);
    auth.getConfiguration.and.returnValue(of({ clientId: 'configured-client' }));
    window.google = { accounts: { id: {
      initialize: options => { expect(options.client_id).toBe('configured-client'); callback = options.callback; },
      renderButton: () => {}
    } } };
    TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule], declarations: [PatientLoginComponent],
      providers: [{ provide: PatientAuthService, useValue: auth }]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(PatientLoginComponent);
  });
  afterEach(() => { fixture.destroy(); window.google = originalGoogle; });

  it('routes a returning patient straight to booking', fakeAsync(() => {
    auth.loginWithGoogle.and.returnValue(of({ patientId: 3, firstName: 'Test', lastName: 'Patient',
      email: 'test@gmail.com', phone: '0211234567', role: 'Patient', token: 'jwt',
      expiresAt: new Date(Date.now() + 60000).toISOString(), requiresProfileCompletion: false }));
    fixture.detectChanges();
    tick(0);
    callback({ credential: 'credential' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/book');
  }));

  it('shows a helpful account-linking error', fakeAsync(() => {
    auth.loginWithGoogle.and.returnValue(throwError(() => ({ status: 409 })));
    fixture.detectChanges();
    tick(0);
    callback({ credential: 'credential' });
    expect(fixture.componentInstance.errorMessage).toContain('contact the clinic');
    expect(router.navigate).not.toHaveBeenCalled();
  }));
  it('returns to the selected service and dentist after Google sign-in', fakeAsync(() => {
    (TestBed.inject(ActivatedRoute).snapshot as any).queryParams = { returnUrl: '/book?service=1&dentist=2' };
    auth.loginWithGoogle.and.returnValue(of({ patientId: 3, firstName: 'Test', lastName: 'Patient',
      email: 'test@gmail.com', phone: '0211234567', role: 'Patient', token: 'jwt',
      expiresAt: new Date(Date.now() + 60000).toISOString(), requiresProfileCompletion: false }));
    fixture.detectChanges(); tick(0); callback({ credential: 'credential' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/book?service=1&dentist=2');
  }));

  it('stops waiting when Google cannot load', fakeAsync(() => {
    delete window.google;
    fixture.detectChanges();
    tick(10200);
    expect(fixture.componentInstance.isPreparing).toBeFalse();
    expect(fixture.componentInstance.errorMessage).toContain('Google could not load');
  }));

  it('cancels pending Google loading when the page is destroyed', fakeAsync(() => {
    delete window.google;
    fixture.detectChanges();
    fixture.destroy();
    tick(11000);
    expect(fixture.componentInstance.errorMessage).toBe('');
  }));
});

