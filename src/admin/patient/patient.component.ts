import { Component, OnInit } from '@angular/core';
import { NgxImageCompressService } from 'ngx-image-compress';
import { PatientService } from '../services/patient.service';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.sass'],
})
export class PatientComponent implements OnInit {
  model: any = {
    patID: '',
    fName: 'test_name',
    lName: 'test_name',
    phone: '123456789',
    city: 'city',
    state: 'state',
  };

  show: boolean = false;
  msg_text: string = '';
  warn: boolean = false;
  success:boolean = false

  ipfs: any;

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {}

  onSubmit() {
    this.show = true
    this.msg_text = "Adding Patient to the Network..."
    console.log(this.model);
    this.checkAddProgress()
    this.patientService.addPatient(this.model.patID, this.model);
  }

  checkAddProgress(){
    console.log("Checking progress");
    
    let checkProgress = setInterval(() => {
      if(this.patientService.added){
        this.msg_text = "Patient Added to the network"
        this.success = true
        clearInterval(checkProgress)
      }
      if(this.patientService.failed){
        this.warn = true
        this.msg_text = "Patient adding Failed"
        clearInterval(checkProgress)
      }
    },500)
  }

  onClose() {
    this.show = false
    this.warn = false
  }
}
