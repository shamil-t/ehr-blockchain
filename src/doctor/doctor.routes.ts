import {Routes} from '@angular/router';

export const DoctorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent),
    children: [
      {
        path: 'doctor-dashboard',
        loadComponent: () => import('./dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
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

