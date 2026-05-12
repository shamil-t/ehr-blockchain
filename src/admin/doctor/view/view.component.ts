import {Component, OnInit, signal, WritableSignal} from '@angular/core';
import {DoctorService} from 'src/admin/services/doctor.service';
import {DoctorType} from "../../../types/doctor.type";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'doctor-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  imports: [
    NgOptimizedImage
  ]
})
export class ViewComponent implements OnInit {
  Doctors: string[] = [];
  DoctorDetails: WritableSignal<DoctorType[]> = signal([]);

  loaded = signal(false);
  loadComplete = signal(false);

  showProgressCard = signal(false);
  showProgressWarn = signal(false);
  progressMsg = signal('')


  constructor(private doctorService: DoctorService) {
    this.progressMsg.set('Loading Doctor Accounts From Blockchain')
  }

  ngOnInit(): void {
    this.loadAllDoctors()
  }

  loadDrDetails() {
    this.DoctorDetails.set([])
    for (let i = 0; i < this.Doctors.length; i++) {
      if (this.Doctors[i]) {
        this.doctorService.getDoctorDetails(this.Doctors[i]).then((data) => {
          data.subscribe((doctor: any) => {
            this.DoctorDetails.set([...this.DoctorDetails(), doctor]);
            // console.log(this.DoctorDetails())
          })
        });
      }
    }
    this.progressMsg.set('')
    this.showProgressCard.set(false)
  }

  loadAllDoctors(): any {
    this.showProgressCard.set(true);
    this.showProgressWarn.set(false);
    this.progressMsg.set('')
    this.loadComplete.set(false)

    this.DoctorDetails.set([])

    if (this.DoctorDetails().length >= 1) {
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
