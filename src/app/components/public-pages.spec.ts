import { ElementRef, NgZone } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { TeamComponent } from './team/team.component';
import { CountUpDirective } from '../directives/count-up.directive';
describe('Public clinic pages', () => {
  it('uses real figures and keeps zero values instead of inventing patient totals', () => {
    const api = { getInfo: () => of({ figures: { patientsHelped: 0, completedVisits: 0, activeDentists: 2, availableServices: 3 }, reviews: [] }) };
    const component = new AboutComponent(api as any); component.ngOnInit();
    expect(component.figures.map(f => f.value)).toEqual([0, 0, 2, 3]);
    expect(component.clinic!.reviews).toEqual([]); component.ngOnDestroy();
  });
  it('keeps the supplied contact details available when the API is unreachable', () => {
    const component = new ContactComponent({ getInfo: () => throwError(() => new Error('offline')) } as any);
    component.ngOnInit(); expect(component.email).toBe('mohammeddabboornz@gmail.com');
    expect(component.phone).toBe('022 597 4228'); component.ngOnDestroy();
  });
  it('shows existing doctor biographies and expands their professional background', () => {
    const doctor = { id: 1, firstName: 'Test', lastName: 'Dentist', specialty: 'General', biography: 'Clinic-supplied professional background.' };
    const component = new TeamComponent({ getTeam: () => of([doctor]) } as any); component.ngOnInit();
    expect(component.doctors[0].biography).toBe(doctor.biography); expect(component.initials(doctor)).toBe('TD');
    component.toggle(1); expect(component.expanded.has(1)).toBeTrue(); component.toggle(1); expect(component.expanded.has(1)).toBeFalse();
    component.ngOnDestroy();
  });
  it('shows final numbers immediately when reduced motion is requested', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const element = document.createElement('span');
    const directive = new CountUpDirective(new ElementRef(element), { runOutsideAngular: (fn: () => void) => fn() } as NgZone);
    directive.appCountUp = 42; directive.ngAfterViewInit(); expect(element.textContent).toBe('42'); directive.ngOnDestroy();
  });
});
