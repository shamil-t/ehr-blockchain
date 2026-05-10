import {Component, OnInit, signal} from '@angular/core';
import {DoctorService} from 'src/admin/services/doctor.service';

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
    specialty: 'specialty',
    imageHash: '',
  };

  DoctorDetails: any = [];

  loaded = signal(false);
  loadComplete = signal(false);

  showProgressCard = signal(false);
  showProgressWarn = signal(false);
  progressMsg = signal('')


  constructor(private doctorService: DoctorService) {
    this.progressMsg.set('Loading Doctor Accounts From Blockchain')

    this.DoctorDetails = doctorService.DoctorDetails
  }

  ngOnInit(): void {
    this.GetDoctors()
  }

  loadDrDetails() {
    console.log(this.Doctors);
    this.DoctorDetails = []
    for (let i = 0; i <= this.Doctors.length; i++) {
      if (this.Doctors[i])
        this.doctorService.getDoctorDetails(this.Doctors[i]).then((data: any) => {
          this.DoctorDetails.push(data)
        });
    }
    this.progressMsg.set('')
    this.showProgressCard.set(false)
  }

  GetDoctors(): any {
    this.showProgressCard.set(true);
    this.showProgressWarn.set(false);
    this.progressMsg.set('')
    this.loadComplete.set(false)

    this.DoctorDetails = []

    if (this.DoctorDetails.length >= 1) {
      this.showProgressCard.set(false)
      return 0
    }

    this.doctorService.getDrs().then((docs: any) => {
      this.Doctors = docs
      if (this.Doctors.length >= 1) {
        this.loadDrDetails();
        this.progressMsg.set("Found " + this.Doctors.length + " Accounts")
      } else {
        this.progressMsg.set('No Doctors in the Network....')
        this.loadComplete.set(true)
        this.showProgressCard.set(false)
      }
    })

  }
}
