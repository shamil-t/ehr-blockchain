import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.sass'],
})
export class ConsultationComponent implements OnInit {
  model: any = {
    patID: '',
  };

  //TODO
  isPatient: boolean = false;

  PatientDetails: any = {};

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {}

  onPatIDSubmit() {
    console.log(this.model.patID);
    this.doctorService
      .checkIsPatient(this.model.patID)
      .then((result: any) => {
        console.log(result);
        if (result) {
          this.doctorService
            .getPatientDetails(this.model.patID)
            .then((data: any) => {
              this.PatientDetails = JSON.parse(data);
              this.isPatient = true;
            })
            .catch((err: any) => {
              console.log(err);
            });
        }
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  onMedRecordSave(data:any){
    this.doctorService.savePatientMedRecord(data).then((result:any)=>{
      if(result){
        console.log(result);
        
      }
    }).catch((err:any)=>{
      console.log(err);
      
    })
  }

}
