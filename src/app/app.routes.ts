import {Routes} from '@angular/router';

export const routes: Routes = [
    {
      path: '',
      loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
    },
    {
      path: 'admin',
      loadChildren: () => import('./admin/admin.routes').then((m) => m.AdminRoutes)
    },
    {
      path: 'doctor',
      loadChildren: () => import('./doctor/doctor.routes').then((m) => m.DoctorRoutes),
    },
    {
      path: '**',
      redirectTo: '',
      pathMatch: "full"
    },
  ]
;
