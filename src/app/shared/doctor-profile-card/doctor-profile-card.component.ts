import {ChangeDetectionStrategy, Component, inject, input, InputSignal} from '@angular/core';
import {DoctorType} from "../../../types/doctor.type";
import {IpfsService} from "../../services/ipfs.service";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-doctor-profile-card',
  templateUrl: './doctor-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './doctor-profile-card.component.sass',
  imports: [
    NgOptimizedImage
  ]
})
export class DoctorProfileCardComponent {

  ipfs = inject(IpfsService)
  doctor: InputSignal<DoctorType | undefined> = input()

  onImageError(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/images/doctor.png';
  }
}
