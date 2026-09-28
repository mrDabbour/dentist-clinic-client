import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { PatientsComponent } from './components/patients/patients.component';
import { authGuard } from './guards/auth.guard';
import { PatientDetailsComponent } from './components/patient-details/patient-details.component';
const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'appointments',
    component: AppointmentsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patients',
    component: PatientsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patients/:id',
    component: PatientDetailsComponent,
    canActivate: [authGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }