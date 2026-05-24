import {Component, effect, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {WalletService} from "../../services/wallet.service";
import {PatientService} from "../services/patient.service";
import {EmergencyContact, GenderType, PatientType} from "../../../types/patient.type";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.sass',
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  walletService = inject(WalletService);
  patientService = inject(PatientService);

  patientForm = this.fb.group({
    walletAddress: [{value: '', disabled: true}, Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['male', Validators.required],
    dateOfBirth: ['', Validators.required],
    bloodGroup: [''],
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    phone: ['', Validators.required],
    address: [''],
    emergencyContact: this.fb.group({
      name: [''],
      relation: [''],
      phone: ['']
    }),
    allergies: this.fb.control<string[]>([]),
    chronicDiseases: this.fb.control<string[]>([]),
    medications: this.fb.control<string[]>([])
  })

  constructor() {
    effect(() => {
      this.patientForm.patchValue({
        walletAddress: this.walletService.connectedAccount()
      })
    });
  }

  async onRegister() {

    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    const formValue = this.patientForm.getRawValue()

    let patient: PatientType = {
      id: "",
      // Blockchain
      walletAddress: formValue.walletAddress || "",
      // Personal Info
      firstName: formValue.firstName || "",
      lastName: formValue.lastName || "",
      gender: (formValue.gender as GenderType),
      dateOfBirth: new Date(formValue.dateOfBirth || ""),
      bloodGroup: formValue.bloodGroup || "",
      // Contact
      email: formValue.email || "",
      phone: formValue.phone || "",
      address: formValue.address || "",
      // Emergency
      emergencyContact: formValue.emergencyContact as EmergencyContact,
      // Medical
      allergies: formValue.allergies || [],
      chronicDiseases: formValue.chronicDiseases || [],
      medications: formValue.medications || [],
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }

    try {
      await this.patientService.registerPatient(patient)
      this.patientForm.reset()
    } catch (error) {
      console.log(error)
    }

  }
}
