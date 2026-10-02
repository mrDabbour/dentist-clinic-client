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

  editing = false;
  saving = false;

  editErrorMessage = '';
  editSuccessMessage = '';

  editPatient = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

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

  startEditing(): void {

    if (!this.patient) {
      return;
    }

    this.editPatient = {
      firstName: this.patient.firstName,
      lastName: this.patient.lastName,
      email: this.patient.email,
      phone: this.patient.phone || ''
    };

    this.editErrorMessage = '';
    this.editSuccessMessage = '';

    this.editing = true;
  }


  cancelEditing(): void {

    this.editing = false;
    this.editErrorMessage = '';
  }


  savePatient(): void {

    if (!this.patient) {
      return;
    }

    const firstName =
      this.editPatient.firstName.trim();

    const lastName =
      this.editPatient.lastName.trim();

    const email =
      this.editPatient.email.trim();

    const phone =
      this.editPatient.phone.trim();

    if (!firstName || !lastName || !email || !phone) {
      this.editErrorMessage =
        'Please complete all patient fields.';
      return;
    }

    this.saving = true;
    this.editErrorMessage = '';
    this.editSuccessMessage = '';

    this.patientService
      .updatePatient(
        this.patient.id,
        {
          firstName,
          lastName,
          email,
          phone
        }
      )
      .subscribe({

        next: (updatedPatient) => {

          this.patient = updatedPatient;

          this.editing = false;
          this.saving = false;

          this.editSuccessMessage =
            'Patient updated successfully.';
        },

        error: (error) => {

          console.error(
            'Failed to update patient:',
            error
          );

          if (error.status === 409) {
            this.editErrorMessage =
              error.error?.message ||
              'This email or phone number is already in use.';
          }
          else if (error.status === 400) {
            this.editErrorMessage =
              'Please check the patient information.';
          }
          else if (error.status === 401) {
            this.editErrorMessage =
              'Your session has expired. Please log in again.';
          }
          else if (error.status === 0) {
            this.editErrorMessage =
              'Cannot connect to the clinic server.';
          }
          else {
            this.editErrorMessage =
              'Could not update patient.';
          }

          this.saving = false;
        }
      });
  }
}