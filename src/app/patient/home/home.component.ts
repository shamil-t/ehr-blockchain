import {Component, inject, OnInit, signal, WritableSignal} from '@angular/core';
import {PatientType} from "../../../types/patient.type";
import {PatientService} from "../services/patient.service";
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-home',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.sass',
})
export class HomeComponent implements OnInit {

  patientService = inject(PatientService);

  patient: WritableSignal<PatientType | null> = signal(null)

  ngOnInit() {
    this.patientService.getPatientProfile().then(patient => {
      this.patient.set(patient)
    })


  }
}
