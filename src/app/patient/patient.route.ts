import {Routes} from "@angular/router";
import {patientGuard} from "../guards/patient.guard";

export const PatientRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivateChild: [patientGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'view-record',
        loadComponent: () => import('./view-record/view-record.component').then(m => m.ViewRecordComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./appointment/appointment.component').then(m => m.AppointmentComponent),
      }
    ]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
  }
]
