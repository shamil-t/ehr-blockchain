import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { SidebarComponent } from './admin-dashboard/sidebar/sidebar.component';
import { HeaderComponent } from './admin-dashboard/header/header.component';
import { DoctorComponent } from './doctor/doctor.component';
import { ViewComponent } from './doctor/view/view.component';
import { AddComponent } from './doctor/add/add.component';
import { FormsModule } from '@angular/forms';
import { NgxImageCompressService } from 'ngx-image-compress';
import { Progress_cardComponent } from 'src/utilities/progress_card/progress_card.component';
import { DoctorService } from './services/doctor.service';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    SidebarComponent,
    HeaderComponent,
    DoctorComponent,
    ViewComponent,
    AddComponent,
    Progress_cardComponent
  ],
  imports: [CommonModule, AdminRoutingModule, FormsModule],
  providers: [NgxImageCompressService,DoctorService],
})
export class AdminModule {}
