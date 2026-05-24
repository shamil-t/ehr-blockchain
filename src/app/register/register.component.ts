import {Component, effect, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {WalletService} from "../services/wallet.service";

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.sass',
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  walletService = inject(WalletService);

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
}
