import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {DoctorService} from '../services/doctor.service';
import {NgOptimizedImage} from "@angular/common";
import {DoctorType} from "../../types/doctor.type";
import {IpfsService} from "../../services/ipfs.service";

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.sass'],
  imports: [
    NgOptimizedImage
  ]
})
export class DashboardHomeComponent implements OnInit {
  DoctorDetails: WritableSignal<DoctorType | null> = signal(null)
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
