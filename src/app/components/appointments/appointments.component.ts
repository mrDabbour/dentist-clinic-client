import { Component, OnInit } from '@angular/core';
import {
  Appointment,
  AppointmentService
} from '../../services/appointment.service';
import {
  Patient,
  PatientService
} from '../../services/patient.service';

import {
  Dentist,
  DentistService
} from '../../services/dentist.service';
import { DentalServiceService } from '../../services/dental-service.service';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {

  appointments: Appointment[] = [];
  patients: Patient[] = [];
  dentists: Dentist[] = [];
  dentalServices: any[] = [];
  searchTerm = '';
  selectedStatus = 'All';
  selectedPatientId: number | null = null;
  selectedDentistId: number | null = null;
  selectedDentalServiceId: number | null = null;
  appointmentDate = '';
  appointmentTime = '';
  appointmentNotes = '';
  creatingAppointment = false;
  formErrorMessage = '';
  showNewAppointmentForm = false;
  loading = true;
  errorMessage = '';

  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private dentistService: DentistService,
    private dentalServiceService: DentalServiceService
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
    this.loadPatients();
    this.loadDentists();
    this.loadDentalServices();
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

  loadPatients(): void {
    this.patientService
      .getPatients()
      .subscribe({
        next: (patients) => {
          this.patients = patients;

          console.log(
            'Patients loaded:',
            patients
          );
        },

        error: (error) => {
          console.error(
            'Failed to load patients:',
            error
          );
        }

      });

  }

  loadDentists(): void {
    this.dentistService
      .getDentists()
      .subscribe({
        next: (dentists) => {
          this.dentists = dentists;
        },

        error: (error) => {
          console.error(
            'Failed to load dentists:',
            error
          );
        }
      });
  }
  loadDentalServices(): void {
    this.dentalServiceService
      .getDentalServices()
      .subscribe({
        next: (services) => {
          this.dentalServices = services;
        },

        error: (error) => {
          console.error(
            'Failed to load dental services:',
            error
          );
        }
      });
  }

  get filteredAppointments(): Appointment[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.appointments.filter((appointment) => {

      const patient =
        (appointment.patientName || '').toLowerCase();

      const dentist =
        (appointment.dentistName || '').toLowerCase();

      const service =
        (appointment.dentalServiceName || '').toLowerCase();

      const matchesSearch =
        search === '' ||
        patient.includes(search) ||
        dentist.includes(search) ||
        service.includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        appointment.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  openNewAppointmentForm(): void {
    this.showNewAppointmentForm = true;
  }

  closeNewAppointmentForm(): void {
    this.showNewAppointmentForm = false;
  }
  createAppointment(): void {

    this.formErrorMessage = '';

    if (
      !this.selectedPatientId ||
      !this.selectedDentistId ||
      !this.selectedDentalServiceId ||
      !this.appointmentDate ||
      !this.appointmentTime
    ) {
      this.formErrorMessage =
        'Please complete all required fields.';

      return;
    }

    const localDateTime =
      `${this.appointmentDate}T${this.appointmentTime}:00`;

    const startTime =
      new Date(localDateTime).toISOString();

    const appointment = {
      patientId: this.selectedPatientId,
      dentistId: this.selectedDentistId,
      dentalServiceId: this.selectedDentalServiceId,
      startTime: startTime,
      notes: this.appointmentNotes.trim()
    };

    this.creatingAppointment = true;

    this.appointmentService
      .createAppointment(appointment)
      .subscribe({

        next: () => {

          this.creatingAppointment = false;

          this.closeNewAppointmentForm();

          this.selectedPatientId = null;
          this.selectedDentistId = null;
          this.selectedDentalServiceId = null;

          this.appointmentDate = '';
          this.appointmentTime = '';
          this.appointmentNotes = '';

          this.loadAppointments();
        },

        error: (error) => {

          console.error(
            'Failed to create appointment:',
            error
          );

          this.creatingAppointment = false;

          this.formErrorMessage =
            error.error?.message ||
            'Could not create appointment.';
        }
      });
  }
}