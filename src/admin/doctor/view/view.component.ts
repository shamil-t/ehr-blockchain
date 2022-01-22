import {
  AfterContentInit,
  AfterViewInit,
  Component,
  OnInit,
} from '@angular/core';
import { DoctorService } from 'src/admin/services/doctor.service';

@Component({
  selector: 'doctor-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
})
export class ViewComponent implements OnInit {
  model: any = {
    acID: '',
  };

  Doctors: string[] = [];

  Doctor: any = {
    docID: '',
    fName: 'First Name',
    lName: 'Last Name',
    Doj: '',
    emailID: 'test_name@mail.com',
    phone: '123456789',
    city: 'city',
    state: 'state',
    speciality: 'speciality',
    imageHash: '',
  };

  DoctorDetails: any = [this.Doctor];

  loaded : boolean = false;
  loadComplete: boolean = false;

  showProgressCard: boolean = false;
  showProgressWarn:boolean = false;
  progressMsg:string = ''

  constructor(private doctorService: DoctorService) {
    this.DoctorDetails = doctorService.DoctorDetails
    this.progressMsg = 'Loading Doctor Accounts From Blockchain'
  }

  ngOnInit(): void {
    let docCall = setInterval(() => {
      console.log('interval');

      this.Doctors = this.doctorService.Doctors;
      if (this.Doctors.length >= 1) {
        this.loadDrDetails();
        this.progressMsg = "Found "+this.Doctors.length + " Accounts"
        clearInterval(docCall);
      }
      else{
        this.showProgressCard = true
        this.showProgressWarn = true
        this.progressMsg = 'No Doctors in the Network....'
      }
    }, 1000);

    let DoctorDetailsCall = setInterval(() => {
      console.log('loading Doc Details');
      console.log('Det len', this.doctorService.DoctorDetails.length);
      console.log('Doc len', this.Doctors.length);

      if(this.doctorService.DoctorDetails.length > 0){
        this.loaded = true
      }

      if (this.doctorService.DoctorDetails.length == this.Doctors.length) {
        console.log(this.doctorService.DoctorDetails);
        this.loadComplete = true
        this.DoctorDetails = this.doctorService.DoctorDetails;
        clearInterval(DoctorDetailsCall);
      } else {
        this.progressMsg = "Loading Doctor Details From IPFS...."
        console.log('Doctor Details... fff', this.doctorService.DoctorDetails);
        this.DoctorDetails = this.doctorService.DoctorDetails;
      }
    }, 5000);
  }

  loadDrDetails() {
    for (var i = 0; i <= this.Doctors.length; i++) {
      this.doctorService.getDoctorDetails(this.Doctors[i]);
    }
  }
}
