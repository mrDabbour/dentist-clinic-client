import { MyAppointmentsComponent } from './components/my-appointments/my-appointments.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { TeamComponent } from './components/team/team.component';
import { PublicFooterComponent } from './components/public-footer.component';
import { CountUpDirective } from './directives/count-up.directive';
import { ServiceCatalogueComponent } from './components/service-catalogue/service-catalogue.component';
import { NotificationBellComponent } from './components/notification-bell/notification-bell.component';
import { InvoiceComponent } from './components/invoice/invoice.component';
import { PatientNotificationsComponent } from './components/patient-notifications/patient-notifications.component';
import { StaffBillingComponent } from './components/staff-billing/staff-billing.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { ServicesComponent } from './components/services/services.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './components/home/home.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { PatientsComponent } from './components/patients/patients.component';
import { PatientDetailsComponent } from './components/patient-details/patient-details.component';
import { DentistsComponent } from './components/dentists/dentists.component';
import { StaffLayoutComponent } from './components/staff-layout/staff-layout.component';
import { PatientLoginComponent } from './components/patient-login/patient-login.component';
import { PatientProfileComponent } from './components/patient-profile/patient-profile.component';
import { BookAppointmentComponent } from './components/book-appointment/book-appointment.component';
@NgModule({
  declarations: [
    AppComponent,
    MyAppointmentsComponent,
    AboutComponent, ContactComponent, TeamComponent, PublicFooterComponent, CountUpDirective,
    ServiceCatalogueComponent,
    NotificationBellComponent,
    NavbarComponent,
    HeroComponent,
    ServicesComponent,
    LoginComponent,
    HomeComponent,
    DashboardComponent,
    AppointmentsComponent,
    PatientsComponent,
    PatientDetailsComponent,
    DentistsComponent,
    StaffLayoutComponent,
    PatientLoginComponent,
    PatientProfileComponent,
    BookAppointmentComponent,
    InvoiceComponent,
    PatientNotificationsComponent,
    StaffBillingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

