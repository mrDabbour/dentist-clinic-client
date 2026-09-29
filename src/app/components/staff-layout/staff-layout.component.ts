import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-staff-layout',
  templateUrl: './staff-layout.component.html',
  styleUrls: ['./staff-layout.component.css']
})
export class StaffLayoutComponent {

  constructor(
    private router: Router
  ) { }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}