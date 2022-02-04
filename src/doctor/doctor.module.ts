import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorRoutingModule } from './doctor-routing.module';
import { DoctorDashboardComponent } from './doctor-dashboard/doctor-dashboard.component';
import { SidebarComponent } from './doctor-dashboard/sidebar/sidebar.component';
import { HeaderComponent } from './doctor-dashboard/header/header.component';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { UtilsModule } from 'src/utils/utils.module';
import { ConsultationComponent } from './consultation/consultation.component';
import { FormsModule } from '@angular/forms';
import { PatientRecordComponent } from './consultation/patient-record/patient-record.component';
import { ViewRecordComponent } from './view-record/view-record.component';
import { RecordComponent } from './view-record/record/record.component';

@NgModule({
  declarations: [
    DoctorDashboardComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardHomeComponent,
    ConsultationComponent,
    PatientRecordComponent,
    ViewRecordComponent,
    RecordComponent,
    
  ],
  imports: [CommonModule,FormsModule, DoctorRoutingModule, UtilsModule],
})
export class DoctorModule {}
