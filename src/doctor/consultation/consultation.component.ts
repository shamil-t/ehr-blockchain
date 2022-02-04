import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  showProggressCard: boolean = false;
  showProgressWarning: boolean = false;
  progressMsg: string = '';

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {}

  onPatIDSubmit() {
    this.showProggressCard = true;
    this.progressMsg = 'Checking for Patient ID';
    this.doctorService
      .checkIsPatient(this.model.patID)
      .then((result: any) => {
        console.log(result);
        if (result) {
          this.progressMsg =
            'Patient ID Found <br> Fetching Patient details From IPFS';
          this.doctorService
            .getPatientDetails(this.model.patID)
            .then((data: any) => {
              this.PatientDetails = JSON.parse(data);
              this.showProggressCard = false;
              this.isPatient = true;
            })
            .catch((err: any) => {
              this.showProgressWarning = true;
              this.progressMsg = 'Failed to get Pateint Details';
              console.log(err);
            });
        }
        else{
          this.showProgressWarning = true;
          this.progressMsg = 'Patient Doesnot Exist in the network......';
        }
      })
      .catch((err: any) => {
        this.showProgressWarning = true;
        this.progressMsg = 'Patient Doesnot Exist in the network......';
        console.log(err);
      });
  }

  onMedRecordSave(data: any) {
    this.progressMsg = 'Saving Med Record in block chain....'
    this.showProggressCard = true
    this.doctorService
      .savePatientMedRecord(data)
      .then((result: any) => {
        if (result) {
          this.progressMsg = 'Medical record added to the blockchian'
          this.showProggressCard = false
          console.log(result);
        }
      })
      .catch((err: any) => {
        this.showProgressWarning = true
        console.log(err);
      });
  }

  onRetry(){
    this.model.patID = ''
    this.showProggressCard = false
    this.progressMsg = ''
    this.showProgressWarning = false
  }
}
