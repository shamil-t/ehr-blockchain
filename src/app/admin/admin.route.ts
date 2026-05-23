import {Routes} from '@angular/router';
import {adminGuard} from "../guards/admin.guard";

export const AdminRoute: Routes = [
  {
    path: '',
    canActivateChild: [adminGuard],
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
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
