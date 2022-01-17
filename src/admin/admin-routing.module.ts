import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { DoctorComponent } from './doctor/doctor.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [{ path: 'doctor', component: DoctorComponent }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
