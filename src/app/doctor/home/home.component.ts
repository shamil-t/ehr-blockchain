import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {DoctorService} from '../services/doctor.service';
import {DoctorType} from "../../../types/doctor.type";
import {IpfsService} from "../../services/ipfs.service";
import {DoctorProfileCardComponent} from "../../shared/doctor-profile-card/doctor-profile-card.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass'],
  imports: [
    DoctorProfileCardComponent
  ]
})
export class HomeComponent implements OnInit {
  DoctorDetails: WritableSignal<DoctorType | undefined> = signal(undefined)
  ipfs = inject(IpfsService)

  constructor(private doctorService: DoctorService) {

  }

  ngOnInit(): void {
    this.getDoctorDetails()
  }

  async getDoctorDetails() {
    this.DoctorDetails.set(await this.doctorService.getDoctor())
  }

}
