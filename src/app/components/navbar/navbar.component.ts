import { Component, HostListener, inject } from '@angular/core';

import { PatientAuthService } from '../../services/patient-auth.service';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  menuOpen = false;
  readonly patientAuth = inject(PatientAuthService);
  @HostListener('document:keydown.escape') closeMenu(): void { this.menuOpen = false; }

}
