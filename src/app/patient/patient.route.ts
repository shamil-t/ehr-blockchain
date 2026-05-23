import {Routes} from "@angular/router";

export const PatientRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'register',
        loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
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
]
