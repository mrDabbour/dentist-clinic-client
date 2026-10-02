import { MyAppointmentsComponent } from './components/my-appointments/my-appointments.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { TeamComponent } from './components/team/team.component';
import { ServiceCatalogueComponent } from './components/service-catalogue/service-catalogue.component';
import { InvoiceComponent } from './components/invoice/invoice.component';
import { PatientNotificationsComponent } from './components/patient-notifications/patient-notifications.component';
import { StaffBillingComponent } from './components/staff-billing/staff-billing.component';
import { patientAuthGuard } from './guards/patient-auth.guard';
import { NgModule } from '@angular/core';
import {
  RouterModule,
  Routes
} from '@angular/router';

import { HomeComponent }
  from './components/home/home.component';

import { LoginComponent }
  from './components/login/login.component';

import { StaffLayoutComponent }
  from './components/staff-layout/staff-layout.component';

import { DashboardComponent }
  from './components/dashboard/dashboard.component';

import { AppointmentsComponent }
  from './components/appointments/appointments.component';

import { PatientsComponent }
  from './components/patients/patients.component';

import { PatientDetailsComponent }
  from './components/patient-details/patient-details.component';

import { DentistsComponent }
  from './components/dentists/dentists.component';

import { authGuard }
  from './guards/auth.guard';

import { PatientLoginComponent }
  from './components/patient-login/patient-login.component';
import { PatientProfileComponent }
  from './components/patient-profile/patient-profile.component';

import { BookAppointmentComponent }
  from './components/book-appointment/book-appointment.component';
const routes: Routes = [
  { path: 'my-appointments', component: MyAppointmentsComponent, canActivate: [patientAuthGuard] },
  { path: 'contact', component: ContactComponent },
  { path: 'about', component: AboutComponent },
  { path: 'team', component: TeamComponent },
  { path: 'services', component: ServiceCatalogueComponent },
  { path: 'invoice/:appointmentId', component: InvoiceComponent, canActivate: [patientAuthGuard] },
  { path: 'patient-notifications', component: PatientNotificationsComponent, canActivate: [patientAuthGuard] },

  // =====================================
  // PUBLIC WEBSITE
  // =====================================

  {
    path: '',
    component: HomeComponent
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'patient-login',
    component: PatientLoginComponent
  },
  {
    path: 'patient-profile',
    component: PatientProfileComponent,
    canActivate: [patientAuthGuard]
  },
  {
    path: 'book',
    component: BookAppointmentComponent,
    canActivate: [patientAuthGuard]
  },
  // =====================================
  // STAFF PORTAL
  // =====================================

  {
    path: '',
    component: StaffLayoutComponent,
    canActivate: [authGuard],

    children: [
      { path: 'billing', component: StaffBillingComponent },

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      {
        path: 'appointments',
        component: AppointmentsComponent
      },

      {
        path: 'patients',
        component: PatientsComponent
      },

      {
        path: 'patients/:id',
        component: PatientDetailsComponent
      },

      {
        path: 'dentists',
        component: DentistsComponent
      }

    ]
  },


  // =====================================
  // FALLBACK
  // =====================================

  {
    path: '**',
    redirectTo: ''
  }

];


@NgModule({

  imports: [
    RouterModule.forRoot(routes)
  ],

  exports: [
    RouterModule
  ]

})
export class AppRoutingModule { }

