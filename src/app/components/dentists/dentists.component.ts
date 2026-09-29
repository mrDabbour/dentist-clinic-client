import { Component, OnInit } from '@angular/core';

import {
  Dentist,
  DentistService
} from '../../services/dentist.service';

@Component({
  selector: 'app-dentists',
  templateUrl: './dentists.component.html',
  styleUrls: ['./dentists.component.css']
})
export class DentistsComponent implements OnInit {

  dentists: Dentist[] = [];

  searchTerm = '';

  statusFilter:
    'all' | 'active' | 'inactive' = 'all';

  loading = true;
  errorMessage = '';

  // ========================================
  // ADD DENTIST
  // ========================================

  showAddForm = false;
  creating = false;

  formErrorMessage = '';
  successMessage = '';

  newDentist = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    registrationNumber: '',
    specialty: '',
    biography: ''
  };


  // ========================================
  // EDIT DENTIST
  // ========================================

  editingDentistId: number | null = null;

  savingEdit = false;

  editErrorMessage = '';
  editSuccessMessage = '';

  editDentist = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    registrationNumber: '',
    specialty: '',
    biography: '',
    isActive: true
  };


  constructor(
    private dentistService: DentistService
  ) { }


  ngOnInit(): void {

    this.loadDentists();
  }


  // ========================================
  // LOAD DENTISTS
  // ========================================

  loadDentists(): void {

    this.loading = true;
    this.errorMessage = '';

    this.dentistService
      .getDentists()
      .subscribe({

        next: (dentists) => {

          this.dentists = dentists;

          this.loading = false;
        },

        error: (error) => {

          console.error(
            'Failed to load dentists:',
            error
          );

          if (error.status === 401) {

            this.errorMessage =
              'Your session has expired. Please log in again.';

          }
          else if (error.status === 403) {

            this.errorMessage =
              'You do not have permission to view dentists.';

          }
          else if (error.status === 0) {

            this.errorMessage =
              'Cannot connect to the clinic server.';

          }
          else {

            this.errorMessage =
              'Could not load dentists.';
          }

          this.loading = false;
        }
      });
  }


  // ========================================
  // SEARCH + STATUS FILTER
  // ========================================

  get filteredDentists(): Dentist[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.dentists.filter(
      dentist => {

        const fullName =
          `${dentist.firstName} ${dentist.lastName}`
            .toLowerCase();

        const specialty =
          (dentist.specialty || '')
            .toLowerCase();

        const registration =
          (dentist.registrationNumber || '')
            .toLowerCase();


        const matchesSearch =
          !search ||
          fullName.includes(search) ||
          specialty.includes(search) ||
          registration.includes(search);


        const matchesStatus =
          this.statusFilter === 'all' ||

          (
            this.statusFilter === 'active' &&
            dentist.isActive
          ) ||

          (
            this.statusFilter === 'inactive' &&
            !dentist.isActive
          );


        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }


  // ========================================
  // SUMMARY COUNTS
  // ========================================

  get activeDentistsCount(): number {

    return this.dentists.filter(
      dentist => dentist.isActive
    ).length;
  }


  get inactiveDentistsCount(): number {

    return this.dentists.filter(
      dentist => !dentist.isActive
    ).length;
  }


  setStatusFilter(
    status: 'all' | 'active' | 'inactive'
  ): void {

    this.statusFilter = status;
  }


  // ========================================
  // INITIALS
  // ========================================

  getInitials(
    dentist: Dentist
  ): string {

    const first =
      dentist.firstName
        ? dentist.firstName.charAt(0)
        : '';

    const last =
      dentist.lastName
        ? dentist.lastName.charAt(0)
        : '';

    return `${first}${last}`
      .toUpperCase();
  }


  // ========================================
  // ADD DENTIST
  // ========================================

  openAddForm(): void {

    this.showAddForm = true;

    this.formErrorMessage = '';
    this.successMessage = '';
  }


  closeAddForm(): void {

    this.showAddForm = false;

    this.formErrorMessage = '';

    this.resetNewDentist();
  }


  resetNewDentist(): void {

    this.newDentist = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      registrationNumber: '',
      specialty: '',
      biography: ''
    };
  }


  createDentist(): void {

    const dentist = {

      firstName:
        this.newDentist.firstName.trim(),

      lastName:
        this.newDentist.lastName.trim(),

      email:
        this.newDentist.email.trim(),

      phone:
        this.newDentist.phone.trim(),

      registrationNumber:
        this.newDentist.registrationNumber.trim(),

      specialty:
        this.newDentist.specialty.trim(),

      biography:
        this.newDentist.biography.trim()
    };


    if (
      !dentist.firstName ||
      !dentist.lastName ||
      !dentist.email ||
      !dentist.phone ||
      !dentist.registrationNumber ||
      !dentist.specialty
    ) {

      this.formErrorMessage =
        'Please complete all required fields.';

      return;
    }


    this.creating = true;

    this.formErrorMessage = '';
    this.successMessage = '';


    this.dentistService
      .createDentist(dentist)
      .subscribe({

        next: (createdDentist) => {

          this.dentists = [
            ...this.dentists,
            createdDentist
          ].sort(
            (a, b) =>
              a.lastName.localeCompare(
                b.lastName
              )
          );


          this.creating = false;

          this.showAddForm = false;

          this.resetNewDentist();

          this.successMessage =
            'Dentist added successfully.';
        },


        error: (error) => {

          console.error(
            'Failed to create dentist:',
            error
          );


          if (error.status === 409) {

            this.formErrorMessage =
              error.error?.message ||
              'This email or registration number is already in use.';

          }
          else if (error.status === 400) {

            this.formErrorMessage =
              'Please check the dentist information.';

          }
          else if (error.status === 401) {

            this.formErrorMessage =
              'Your session has expired. Please log in again.';

          }
          else if (error.status === 403) {

            this.formErrorMessage =
              'Only an administrator can add dentists.';

          }
          else if (error.status === 0) {

            this.formErrorMessage =
              'Cannot connect to the clinic server.';

          }
          else {

            this.formErrorMessage =
              'Could not add dentist.';
          }


          this.creating = false;
        }
      });
  }


  // ========================================
  // START EDITING
  // ========================================

  startEditing(
    dentist: Dentist
  ): void {

    this.editingDentistId =
      dentist.id;


    this.editDentist = {

      firstName:
        dentist.firstName,

      lastName:
        dentist.lastName,

      email:
        dentist.email,

      phone:
        dentist.phone,

      registrationNumber:
        dentist.registrationNumber,

      specialty:
        dentist.specialty,

      biography:
        dentist.biography || '',

      isActive:
        dentist.isActive
    };


    this.editErrorMessage = '';
    this.editSuccessMessage = '';
  }


  // ========================================
  // CANCEL EDITING
  // ========================================

  cancelEditing(): void {

    this.editingDentistId = null;

    this.editErrorMessage = '';
  }


  // ========================================
  // SAVE DENTIST
  // ========================================

  saveDentist(): void {

    if (
      this.editingDentistId === null
    ) {
      return;
    }


    const dentist = {

      firstName:
        this.editDentist.firstName.trim(),

      lastName:
        this.editDentist.lastName.trim(),

      email:
        this.editDentist.email.trim(),

      phone:
        this.editDentist.phone.trim(),

      registrationNumber:
        this.editDentist
          .registrationNumber
          .trim(),

      specialty:
        this.editDentist
          .specialty
          .trim(),

      biography:
        this.editDentist
          .biography
          .trim(),

      isActive:
        this.editDentist.isActive
    };


    if (
      !dentist.firstName ||
      !dentist.lastName ||
      !dentist.email ||
      !dentist.phone ||
      !dentist.registrationNumber ||
      !dentist.specialty
    ) {

      this.editErrorMessage =
        'Please complete all required fields.';

      return;
    }


    this.savingEdit = true;

    this.editErrorMessage = '';
    this.editSuccessMessage = '';


    this.dentistService
      .updateDentist(
        this.editingDentistId,
        dentist
      )
      .subscribe({

        next: (updatedDentist) => {

          const index =
            this.dentists.findIndex(
              dentist =>
                dentist.id ===
                updatedDentist.id
            );


          if (index !== -1) {

            this.dentists[index] =
              updatedDentist;

            this.dentists = [
              ...this.dentists
            ];
          }


          this.savingEdit = false;

          this.editingDentistId = null;

          this.editSuccessMessage =
            'Dentist updated successfully.';
        },


        error: (error) => {

          console.error(
            'Failed to update dentist:',
            error
          );


          if (error.status === 409) {

            this.editErrorMessage =
              error.error?.message ||
              'Another dentist already uses this email or registration number.';

          }
          else if (error.status === 400) {

            this.editErrorMessage =
              'Please check the dentist information.';

          }
          else if (error.status === 401) {

            this.editErrorMessage =
              'Your session has expired. Please log in again.';

          }
          else if (error.status === 403) {

            this.editErrorMessage =
              'Only an administrator can edit dentists.';

          }
          else if (error.status === 0) {

            this.editErrorMessage =
              'Cannot connect to the clinic server.';

          }
          else {

            this.editErrorMessage =
              'Could not update dentist.';
          }


          this.savingEdit = false;
        }
      });
  }
}