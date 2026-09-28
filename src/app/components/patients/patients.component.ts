import { Component, OnInit } from '@angular/core';
import {
  Patient,
  PatientService
} from '../../services/patient.service';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {

  patients: Patient[] = [];
  searchTerm = '';

  loading = true;
  errorMessage = '';

  // Add Patient
  showAddPatientForm = false;

  newPatient = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  creatingPatient = false;
  formErrorMessage = '';
  successMessage = '';

  constructor(
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.loadPatients();
  }

  // =========================
  // Load Patients
  // =========================

  loadPatients(): void {

    this.loading = true;
    this.errorMessage = '';

    this.patientService
      .getPatients()
      .subscribe({

        next: (patients) => {
          this.patients = patients;
          this.loading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load patients:',
            error
          );

          if (error.status === 401) {
            this.errorMessage =
              'Your session has expired. Please log in again.';
          }
          else if (error.status === 403) {
            this.errorMessage =
              'You do not have permission to view patients.';
          }
          else if (error.status === 0) {
            this.errorMessage =
              'Cannot connect to the clinic server.';
          }
          else {
            this.errorMessage =
              'Could not load patients. Please try again.';
          }

          this.loading = false;
        }
      });
  }

  // =========================
  // Add Patient Form
  // =========================

  openAddPatientForm(): void {
    this.showAddPatientForm = true;
    this.formErrorMessage = '';
  }

  closeAddPatientForm(): void {

    this.showAddPatientForm = false;
    this.formErrorMessage = '';

    this.newPatient = {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    };
  }

  // =========================
  // Create Patient
  // =========================

  createPatient(): void {

    this.formErrorMessage = '';

    const firstName =
      this.newPatient.firstName.trim();

    const lastName =
      this.newPatient.lastName.trim();

    const email =
      this.newPatient.email.trim();

    const phone =
      this.newPatient.phone.trim();

    // Required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone
    ) {
      this.formErrorMessage =
        'Please complete all patient fields.';
      return;
    }

    // Basic email validation
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.formErrorMessage =
        'Please enter a valid email address.';
      return;
    }

    this.creatingPatient = true;

    const patientData = {
      firstName,
      lastName,
      email,
      phone
    };

    this.patientService
      .createPatient(patientData)
      .subscribe({

        next: (patient) => {

          // Show patient immediately
          this.patients.unshift(patient);

          this.successMessage =
            `${patient.firstName} ${patient.lastName} was added successfully.`;

          setTimeout(() => {
            this.successMessage = '';
          }, 4000);

          // Reset form
          this.newPatient = {
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
          };

          this.creatingPatient = false;
          this.showAddPatientForm = false;
          this.formErrorMessage = '';
        },

        error: (error) => {

          console.error(
            'Failed to create patient:',
            error
          );

          // Validation
          if (error.status === 400) {

            // Try to display API validation message
            if (error.error?.errors) {

              const validationErrors =
                Object.values(
                  error.error.errors
                ).flat();

              this.formErrorMessage =
                validationErrors.join(' ');
            }
            else if (error.error?.message) {
              this.formErrorMessage =
                error.error.message;
            }
            else {
              this.formErrorMessage =
                'Please check the patient details.';
            }
          }

          // Authentication
          else if (error.status === 401) {
            this.formErrorMessage =
              'Your session has expired. Please log in again.';
          }

          // Authorization
          else if (error.status === 403) {
            this.formErrorMessage =
              'You do not have permission to add patients.';
          }

          // Conflict
          else if (error.status === 409) {
            this.formErrorMessage =
              error.error?.message ||
              'This patient already exists.';
          }

          // Backend unavailable
          else if (error.status === 0) {
            this.formErrorMessage =
              'Cannot connect to the clinic server.';
          }

          // Server error
          else if (error.status >= 500) {
            this.formErrorMessage =
              'The server encountered an error. Please try again.';
          }

          // Unknown error
          else {
            this.formErrorMessage =
              error.error?.message ||
              'Could not create patient.';
          }

          this.creatingPatient = false;
        }
      });
  }

  // =========================
  // Search Patients
  // =========================

  get filteredPatients(): Patient[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    if (!search) {
      return this.patients;
    }

    return this.patients.filter(
      (patient) => {

        const fullName =
          `${patient.firstName} ${patient.lastName}`
            .toLowerCase();

        const email =
          (patient.email || '')
            .toLowerCase();

        const phone =
          (patient.phone || '')
            .toLowerCase();

        return (
          fullName.includes(search) ||
          email.includes(search) ||
          phone.includes(search)
        );
      }
    );
  }
}