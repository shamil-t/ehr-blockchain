import { Component, Input, OnInit } from '@angular/core';

type MedicationType = [
  {
    name: '';
    dose: '';
    frequency: '';
    nofDays: '';
    remarks: '';
  }
];

type PatientMedicalrecordType = {
  Diagnosis: '';
  Medication: MedicationType;
  ClinicalTest: [];
};

@Component({
  selector: 'app-patient-record',
  templateUrl: './patient-record.component.html',
  styleUrls: ['./patient-record.component.sass'],
})
export class PatientRecordComponent implements OnInit {
  @Input() PatientDetails: any = {};

  model: any;

  Medication: any[] = [];
  ClinicalTest: any[] = [];

  med: any = {};
  clinic: any = {};

  constructor() {
    this.model = {};
  }

  ngOnInit(): void {
    console.log();
  }

  onMedicinesSave() {
    this.Medication.push(this.med);
    this.med = {};
  }

  onTestSave() {
    this.ClinicalTest.push(this.clinic);
    this.clinic = {};
  }

  onPatientRecordSubmit() {
    this.model.medication = this.Medication;
    this.model.tests = this.ClinicalTest;

    console.log(this.model);
    
  }
}
