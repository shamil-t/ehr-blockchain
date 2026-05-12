import {Component, inject, OnInit, signal} from '@angular/core';
import {DoctorService} from 'src/admin/services/doctor.service';
import {KuboRPCClient} from "kubo-rpc-client";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {Progress_cardComponent} from "../../../utils/progress_card/progress_card.component";
import {NgOptimizedImage} from "@angular/common";


@Component({
  selector: 'doctor-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.sass'],
  imports: [
    FormsModule,
    Progress_cardComponent,
    NgOptimizedImage,
    ReactiveFormsModule
  ]
})
export class AddComponent implements OnInit {

  fb = inject(FormBuilder)
  doctorForm = this.fb.group({
    fName: ['test_name', Validators.required],
    lName: ['test_name'],
    doj: ['10/10/2010', Validators.required],
    emailId: ['test_name@mail.com', [Validators.required, Validators.email]],
    phone: ['1212121212', Validators.required],
    docId: ['0x70997970c51812dc3a010c7d01b50e0d17dc79c8', Validators.required],
    city: ['tests', Validators.required],
    state: ['test'],
    speciality: ['test', Validators.required],
    image: ['']
  });

  image_url = signal('')

  show = signal(false);
  msg_text = signal('');
  warn = signal(false);
  success = signal(false)

  ipfs: KuboRPCClient;

  constructor(
    private ds: DoctorService
  ) {
    this.ipfs = ds.ipfs
  }

  ngOnInit(): void {
    this.ipfs = this.ds.ipfs
  }

  onAddDocSubmit() {
    this.show.set(true);
    this.msg_text.set('Adding Doctor to the Network....');
    this.warn.set(false);
    this.success.set(false)

    this.doctorForm.controls.image.setValue(this.image_url() ?? '')

    this.ds.addDoctor(this.doctorForm.value).then((r: any) => {
      this.success.set(true)
      this.msg_text.set('Data added to IPFS...');
      this.msg_text.set('<br>User Added to the Blockchain');
      console.log('User added Successfully');
      this.doctorForm.reset();
    }).catch((er: any) => {
      this.warn.set(true)
      this.msg_text.set('Adding Doctor Failed<br>1.not a valid address or <br>2.Already have a role');
      console.log(er);
    })
  }


  PreviewImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        this.image_url.set(event.target.result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  onClose() {
    this.show.set(false);
    this.warn.set(false);
  }

  protected validateDocId() {
    return this.doctorForm.controls.docId.value?.length != 42;
  }
}
