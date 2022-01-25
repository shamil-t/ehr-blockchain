import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorRoutingModule } from './doctor-routing.module';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';
import { SidebarComponent } from './doctor-dashboard/sidebar/sidebar.component';
import { HeaderComponent } from './doctor-dashboard/header/header.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { UtilsModule } from 'src/utils/utils.module';


@NgModule({
  declarations: [
    DoctorDashboardComponent,
    SidebarComponent,
    HeaderComponent,
    
    DashboardHomeComponent
  ],
  imports: [
    CommonModule,
    DoctorRoutingModule,
    UtilsModule
  ]
})
export class DoctorModule { }
