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

  DoctorDetails: any = [];

  loaded : boolean = false;
  loadComplete: boolean = false;

  showProgressCard: boolean = false;
  showProgressWarn:boolean = false;
  progressMsg:string = ''
  

  constructor(private doctorService: DoctorService) {
    this.progressMsg = 'Loading Doctor Accounts From Blockchain'

    this.DoctorDetails = doctorService.DoctorDetails
  }

  ngOnInit(): void {
    this.GetDoctors()
  }

  loadDrDetails() {
    console.log(this.Doctors);
    this.DoctorDetails = []
    for (var i = 0; i <= this.Doctors.length; i++) {
      this.doctorService.getDoctorDetails(this.Doctors[i]).then((data:any)=>{
        this.DoctorDetails.push(data)
      });
    }
    this.progressMsg = ''
    this.showProgressCard = false
  }

  GetDoctors(): any{
    this.showProgressCard= true;
    this.showProgressWarn = false;
    this.progressMsg = ''

    if(this.DoctorDetails.length >= 1){
      this.showProgressCard = false
      return 0
    }

    this.doctorService.getDrs().then((docs:any)=>{
      this.Doctors = docs
      if (this.Doctors.length >= 1) {
        this.loadDrDetails();
        this.progressMsg = "Found "+this.Doctors.length + " Accounts"
      }
      else{
        this.progressMsg = 'No Doctors in the Network....'
      }
    })
    
    // let docCall = setInterval(() => {
    //   console.log('interval',this.doctorService.Doctors);
    //   this.Doctors = this.doctorService.Doctors || [];
    //   if (this.Doctors.length >= 1) {
    //     this.loadDrDetails();
    //     this.progressMsg = "Found "+this.Doctors.length + " Accounts"
    //     clearInterval(docCall);
    //   }
    //   else{
    //     this.progressMsg = 'No Doctors in the Network....'
    //   }
    // }, 1000);

    // let DoctorDetailsCall = setInterval(() => {

    //   if(this.Doctors.length <= 0){
    //     clearInterval(DoctorDetailsCall)
    //   }

    //   if(this.doctorService.DoctorDetails.length > 0){
    //     this.loaded = true
    //   }

    //   if (this.doctorService.DoctorDetails.length == this.Doctors.length) {
    //     console.log(this.doctorService.DoctorDetails);
    //     this.showProgressCard = false
    //     this.loadComplete = true
    //     this.DoctorDetails = this.doctorService.DoctorDetails;
    //     clearInterval(DoctorDetailsCall);
    //   } else {
    //     this.progressMsg = "Loading Doctor Details From IPFS...."
    //     console.log('Doctor Details... fff', this.doctorService.DoctorDetails);
    //     this.DoctorDetails = this.doctorService.DoctorDetails;
    //   }
    // }, 5000);
    
  }
}
