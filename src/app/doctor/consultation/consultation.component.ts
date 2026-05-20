import {Component, OnInit} from '@angular/core';
import {DoctorService} from '../services/doctor.service';
import {FormsModule} from "@angular/forms";
import {PatientRecordComponent} from "./patient-record/patient-record.component";

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.sass'],
  imports: [
    FormsModule,
    PatientRecordComponent
  ]
})
export class ConsultationComponent implements OnInit {
  model: any = {
    patID: '',
  };

  isPatient: boolean = false;

  PatientDetails: any = {};

  constructor(private doctorService: DoctorService) {
  }

  ngOnInit(): void {
  }

  onPatIDSubmit() {

  }

  onMedRecordSave(data: any) {

  }

}
