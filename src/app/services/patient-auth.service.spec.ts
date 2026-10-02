import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PatientAuthService, PatientAuthResponse, PATIENT_API_URL } from './patient-auth.service';

describe('PatientAuthService', () => {
  let service: PatientAuthService;
  let http: HttpTestingController;
  const response: PatientAuthResponse = {
    patientId: 3, firstName: 'Test', lastName: 'Patient', email: 'test@gmail.com', phone: null,
    role: 'Patient', token: 'patient-jwt', expiresAt: new Date(Date.now() + 60000).toISOString(),
    requiresProfileCompletion: true
  };
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PatientAuthService);
    http = TestBed.inject(HttpTestingController);
    service.logout();
  });
  afterEach(() => { http.verify(); service.logout(); });

  it('exchanges the Google credential and keeps the session out of localStorage', () => {
    service.loginWithGoogle('google-credential').subscribe();
    const request = http.expectOne(`${PATIENT_API_URL}/google`);
    expect(request.request.body).toEqual({ idToken: 'google-credential' });
    request.flush(response);
    expect(service.getToken()).toBe('patient-jwt');
    expect(localStorage.getItem('patient_token')).toBeNull();
    expect(JSON.parse(sessionStorage.getItem('patient_profile')!).token).toBeUndefined();
  });

  it('clears an expired session', () => {
    service.saveSession({ ...response, expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(service.getToken()).toBeNull();
    expect(sessionStorage.getItem('patient_profile')).toBeNull();
  });

  it('removes legacy persistent tokens', () => {
    localStorage.setItem('patient_token', 'old-token');
    service.saveSession(response);
    expect(localStorage.getItem('patient_token')).toBeNull();
  });
});
