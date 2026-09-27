import { TestBed } from '@angular/core/testing';

import { DentalServiceService } from './dental-service.service';

describe('DentalServiceService', () => {
  let service: DentalServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DentalServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
