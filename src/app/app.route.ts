import {Routes} from '@angular/router';

export const routes: Routes = [
    {
      path: '',
      loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
    },
    {
      path: 'admin',
      loadChildren: () => import('./admin/admin.route').then((m) => m.AdminRoute)
    },
    {
      path: 'doctor',
      loadChildren: () => import('./doctor/doctor.route').then((m) => m.DoctorRoute),
    },
    {
      path: 'patient',
      loadChildren: () => import('./patient/patient.route').then((m) => m.PatientRoute),
    },
    {
      path: 'register',
      loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent),
    },
    {
      path: '**',
      redirectTo: '',
      pathMatch: "full"
    },
  ]
;
