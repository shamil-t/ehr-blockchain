import {Component, inject, input, InputSignal} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {DoctorType} from "../../../types/doctor.type";
import {IpfsService} from "../../services/ipfs.service";

@Component({
  selector: 'app-doctor-profile-card',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './doctor-profile-card.component.html',
  styleUrl: './doctor-profile-card.component.sass',
})
export class DoctorProfileCardComponent {

  ipfs = inject(IpfsService)
  doctor: InputSignal<DoctorType | undefined> = input()


}
