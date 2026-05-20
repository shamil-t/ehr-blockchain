import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {DoctorService} from 'src/app/admin/services/doctor.service';
import {DoctorType} from "../../../../types/doctor.type";
import {IpfsService} from "../../../services/ipfs.service";
import {DoctorProfileCardComponent} from "../../../shared/doctor-profile-card/doctor-profile-card.component";

@Component({
  selector: 'doctor-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  imports: [
    DoctorProfileCardComponent
  ]
})
export class ViewComponent implements OnInit {
  ipfs = inject(IpfsService)

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
    this.loadAllDoctors().then(_r => {
    }).catch(err => {
      console.log(err)
    })
  }

  async loadAllDoctors(): Promise<any> {
    this.showProgressCard.set(true);
    this.showProgressWarn.set(false);
    this.progressMsg.set('')
    this.loadComplete.set(false)
    this.DoctorDetails.set([])
    this.DoctorDetails.set(await this.doctorService.getAllDoctors())
    if (this.DoctorDetails().length >= 1) {
      this.progressMsg.set("Found " + this.DoctorDetails().length + " Accounts")
    } else {
      this.progressMsg.set('No Doctors in the Network....')
      this.loadComplete.set(true)
      this.showProgressCard.set(false)
    }
  }
}
