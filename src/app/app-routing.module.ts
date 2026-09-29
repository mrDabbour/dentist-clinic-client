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


const routes: Routes = [

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


  // =====================================
  // STAFF PORTAL
  // =====================================

  {
    path: '',
    component: StaffLayoutComponent,
    canActivate: [authGuard],

    children: [

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