import {Routes} from '@angular/router';
import {adminGuard} from "../guards/admin.guard";

export const AdminRoutes: Routes = [
  {
    path: '',
    canActivateChild: [adminGuard],
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'doctor',
        loadComponent: () => import('./doctor/doctor.component').then(m => m.DoctorComponent)
      }
    ],
  },
  {
    path: '**',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full',
  }
];
