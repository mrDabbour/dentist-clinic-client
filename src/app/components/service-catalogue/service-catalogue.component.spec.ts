import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ServiceCatalogueComponent } from './service-catalogue.component';
@Component({ selector: 'app-navbar', template: '' }) class NavbarStub {}
describe('Public service catalogue', () => {
  it('loads public services, filters treatments and sends booking links to the patient flow', () => {
    TestBed.configureTestingModule({ declarations: [ServiceCatalogueComponent, NavbarStub],
      imports: [CommonModule, FormsModule, HttpClientTestingModule, RouterTestingModule] });
    const fixture = TestBed.createComponent(ServiceCatalogueComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('http://localhost:8080/api/public/services'); expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, name: 'Check-up', category: 'General', description: 'Routine visit', price: 45, durationMinutes: 30 },
      { id: 2, name: 'Whitening', category: 'Cosmetic', description: 'Smile care', price: 115, durationMinutes: 60 }]);
    fixture.detectChanges(); expect(fixture.nativeElement.querySelectorAll('.treatment').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.treatment a').getAttribute('href')).toBe('/book');
    fixture.componentInstance.category = 'Cosmetic'; fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.treatment').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.treatment').textContent).toContain('Whitening');
    fixture.componentInstance.search = 'missing'; fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
    http.verify(); fixture.destroy();
  });
});
