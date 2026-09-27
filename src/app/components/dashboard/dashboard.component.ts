import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Appointment,
  AppointmentService
} from '../../services/appointment.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  appointments: Appointment[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.appointmentService.getAppointments()
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          this.loading = false;

          console.log('Appointments:', appointments);
        },

        error: (error) => {
          console.error('Failed to load appointments:', error);
          this.errorMessage = 'Could not load appointments.';
          this.loading = false;
        }
      });
  }

  get totalAppointments(): number {
    return this.appointments.length;
  }

  get pendingAppointments(): number {
    return this.appointments.filter(
      appointment => appointment.status === 'Pending'
    ).length;
  }

  get completedAppointments(): number {
    return this.appointments.filter(
      appointment => appointment.status === 'Completed'
    ).length;
  }
  confirmAppointment(id: number): void {

    this.appointmentService
      .confirmAppointment(id)
      .subscribe({
        next: () => {
          this.loadAppointments();
        },

        error: (error) => {
          console.error(
            'Failed to confirm appointment:',
            error
          );
        }
      });
  }

  completeAppointment(id: number): void {

    this.appointmentService
      .completeAppointment(id)
      .subscribe({
        next: () => {
          this.loadAppointments();
        },

        error: (error) => {
          console.error(
            'Failed to complete appointment:',
            error
          );
        }
      });
  }

  cancelAppointment(id: number): void {

    this.appointmentService
      .cancelAppointment(id)
      .subscribe({
        next: () => {
          this.loadAppointments();
        },

        error: (error) => {
          console.error(
            'Failed to cancel appointment:',
            error
          );
        }
      });
  }
  

  markNoShow(id: number): void {

    this.appointmentService
      .markNoShow(id)
      .subscribe({
        next: () => {
          this.loadAppointments();
        },

        error: (error) => {
          console.error(
            'Failed to mark appointment as no-show:',
            error
          );
        }
      });
  }

  get activeAppointments(): Appointment[] {
    return this.appointments.filter(
      appointment =>
        appointment.status === 'Pending' ||
        appointment.status === 'Confirmed'
    );
  }

  get appointmentHistory(): Appointment[] {
    return this.appointments.filter(
      appointment =>
        appointment.status === 'Completed' ||
        appointment.status === 'Cancelled' ||
        appointment.status === 'NoShow'
    );
  }
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}


