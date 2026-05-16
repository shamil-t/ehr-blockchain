import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {DoctorService} from 'src/admin/services/doctor.service';
import {DoctorType} from "../../../types/doctor.type";
import {NgOptimizedImage} from "@angular/common";
import {IpfsService} from "../../../services/ipfs.service";

@Component({
  selector: 'doctor-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  imports: [
    NgOptimizedImage
  ]
})
export class ViewComponent implements OnInit {
  ipfs = inject(IpfsService)
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

  async loadDrDetails() {
    this.DoctorDetails.set([])
    for (let i = 0; i < this.Doctors.length; i++) {
      if (this.Doctors[i]) {
        const doctor = await this.doctorService.getDoctorDetails(this.Doctors[i])
        console.log(doctor)
        this.DoctorDetails.set([...this.DoctorDetails(), doctor]);
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
