import { Component, OnInit } from '@angular/core';

import { NgxImageCompressService } from 'ngx-image-compress';
import { DoctorService } from 'src/admin/services/doctor.service';

// declare let window: any;
// const { ethereum } = window;

@Component({
  selector: 'doctor-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.sass'],
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
    speciality: 'speciality',
    imageHash: '',
  };

  image_url: any;
  imageCompressedUrl: string = '';

  show: boolean = false;
  msg_text: string = '';
  warn: boolean = false;
  success: boolean = false

  ipfs: any;

  constructor(
    private imageCompress: NgxImageCompressService,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.ipfs = this.doctorService.ipfs
    // console.log(ethereum);
    // ethereum.on('message', (message: string) => console.log(message));
  }

  onAddDocSubmit() {
    this.show = true;
    this.msg_text = 'Adding Doctor to the Network....';
    this.warn = false;

    this.model.imageHash = this.image_url;
    // add doctor
    // await this.doctorService.addDoctor(this.model, this.model.docID);

    let data = this.model;

    this.ipfs.addJSON(data).then((IPFShash: string) => {
      console.log(IPFShash);
      this.msg_text = 'Data added to IPFS...';
      //add data to blockchain
      this.doctorService.contract.methods
        .addDrInfo(this.model.docID, IPFShash)
        .send({ from: this.doctorService.account })
        .on("confirmation",(result: any) => {
          console.log('result', result);
          if (result == 1) {
            this.msg_text += '<br>User Added to the Blockchain';
            console.log('User added Successfully');
            this.success = true
            this.model = {};
            return result;
          } else {
            this.warn = !this.warn;
            this.msg_text = this.doctorService.msg_text;
            console.log(result);
            return result;
          }
        })
        .catch((err: any) => {
          this.warn = !this.warn;
          this.msg_text =
            'Adding Doctor Failed<br> <small class="fw-light text-danger"><b>"</b>' +
            this.model.docID +
            '<b>"</b></small><br>1.not a valid address or <br>2.Already have a role';
          console.log(err);
          return err;
        });
    });
  }

  PreviewImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      var reader = new FileReader();
      reader.onload = (event: any) => {
        this.image_url = event.target.result;
        this.compressImage();
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  compressImage() {
    this.imageCompress
      .compressFile(this.image_url, 50, 50)
      .then((compressedImage) => {
        this.imageCompressedUrl = compressedImage;
        this.image_url = this.imageCompressedUrl;
      })
      .catch((er) => {
        console.log(er);
      });
  }

  onClose() {
    this.show = false;
    this.warn = false;
  }
}
