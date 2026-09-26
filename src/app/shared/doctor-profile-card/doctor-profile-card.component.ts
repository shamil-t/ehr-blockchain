import {Component, inject, input, InputSignal, ChangeDetectionStrategy} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";
import {DoctorType} from "../../../types/doctor.type";
import {IpfsService} from "../../services/ipfs.service";

@Component({
  selector: 'app-doctor-profile-card',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './doctor-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './doctor-profile-card.component.sass',
})
export class DoctorProfileCardComponent {

  ipfs = inject(IpfsService)
  doctor: InputSignal<DoctorType | undefined> = input()


}
