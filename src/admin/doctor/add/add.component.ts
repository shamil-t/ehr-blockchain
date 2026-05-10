import {Component, OnInit} from '@angular/core';
import {DoctorService} from 'src/admin/services/doctor.service';
import {KuboRPCClient} from "kubo-rpc-client";
import {FormsModule} from "@angular/forms";
import {Progress_cardComponent} from "../../../utils/progress_card/progress_card.component";


@Component({
  selector: 'doctor-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.sass'],
  imports: [
    FormsModule,
    Progress_cardComponent
  ]
})
export class AddComponent implements OnInit {
  model: any = {
    docID: '',
    fName: 'test_name',
    lName: 'test_name',
    Doj: '',
    emailID: 'test_name@mail.com',
    phone: '123456789',
    city: 'city',
    state: 'state',
    specialty: 'specialty',
    imageHash: '',
  };

  image_url: any;

  show: boolean = false;
  msg_text: string = '';
  warn: boolean = false;
  success: boolean = false

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
    this.show = true;
    this.msg_text = 'Adding Doctor to the Network....';
    this.warn = false;
    this.success = false

    this.model.imageHash = this.image_url;

    let data = this.model;

    this.ds.addDoctor(this.model.docID, data).then((r: any) => {
      this.success = true
      this.msg_text = 'Data added to IPFS...';
      this.msg_text += '<br>User Added to the Blockchain';
      console.log('User added Successfully');

      this.model = {}

    }).catch((er: any) => {
      this.warn = true
      this.msg_text =
        'Adding Doctor Failed<br> <small class="fw-light text-danger"><b>"</b>' +
        this.model.docID +
        '<b>"</b></small><br>1.not a valid address or <br>2.Already have a role';
      console.log(er);
    })
  }


  PreviewImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        this.image_url = event.target.result;
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  onClose() {
    this.show = false;
    this.warn = false;
  }
}
