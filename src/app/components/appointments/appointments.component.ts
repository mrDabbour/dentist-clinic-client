import { Component, OnInit } from '@angular/core';
import {
  Appointment,
  AppointmentService
} from '../../services/appointment.service';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {

  appointments: Appointment[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private appointmentService: AppointmentService
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.appointmentService
      .getAppointments()
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          this.loading = false;
        },

        error: (error) => {
          console.error(
            'Failed to load appointments:',
            error
          );

          this.errorMessage =
            'Could not load appointments.';

          this.loading = false;
        }
      });
  }
}