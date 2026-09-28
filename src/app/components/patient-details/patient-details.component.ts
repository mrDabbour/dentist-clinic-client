import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  Patient,
  PatientService
} from '../../services/patient.service';

import {
  Appointment,
  AppointmentService
} from '../../services/appointment.service';

@Component({
  selector: 'app-patient-details',
  templateUrl: './patient-details.component.html',
  styleUrls: ['./patient-details.component.css']
})
export class PatientDetailsComponent implements OnInit {

  patient: Patient | null = null;

  appointments: Appointment[] = [];

  loading = true;
  appointmentsLoading = true;

  errorMessage = '';
  appointmentsErrorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit(): void {

    const id =
      Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Invalid patient ID.';
      this.loading = false;
      this.appointmentsLoading = false;
      return;
    }

    this.loadPatient(id);
    this.loadAppointments(id);
  }

  loadPatient(id: number): void {

    this.loading = true;
    this.errorMessage = '';

    this.patientService
      .getPatient(id)
      .subscribe({

        next: (patient) => {
          this.patient = patient;
          this.loading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load patient:',
            error
          );

          if (error.status === 404) {
            this.errorMessage =
              'Patient not found.';
          }
          else if (error.status === 401) {
            this.errorMessage =
              'Your session has expired. Please log in again.';
          }
          else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to the clinic server.';
          }
          else {
            this.errorMessage =
              'Could not load patient.';
          }

          this.loading = false;
        }
      });
  }

  loadAppointments(patientId: number): void {

    this.appointmentsLoading = true;
    this.appointmentsErrorMessage = '';

    this.appointmentService
      .getAppointments(patientId)
      .subscribe({

        next: (appointments) => {

          this.appointments = appointments;

          this.appointmentsLoading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load appointment history:',
            error
          );

          if (error.status === 401) {
            this.appointmentsErrorMessage =
              'Your session has expired.';
          }
          else if (error.status === 0) {
            this.appointmentsErrorMessage =
              'Cannot connect to the clinic server.';
          }
          else {
            this.appointmentsErrorMessage =
              'Could not load appointment history.';
          }

          this.appointmentsLoading = false;
        }
      });
  }
}