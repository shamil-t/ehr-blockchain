import {Routes} from '@angular/router';
import {doctorGuard} from "../guards/doctor.guard";

export const DoctorRoutes: Routes = [
  {
    path: '',
    canActivateChild: [doctorGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'consult',
        loadComponent: () => import('./consultation/consultation.component').then(m => m.ConsultationComponent),
      },
      {
        path: 'view-record',
        loadComponent: () => import('./view-record/view-record.component').then(m => m.ViewRecordComponent),
      }
    ],
  }
];

