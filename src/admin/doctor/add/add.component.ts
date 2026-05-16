import {Component, inject, OnInit, signal} from '@angular/core';
import {DoctorService} from 'src/admin/services/doctor.service';
import {KuboRPCClient} from "kubo-rpc-client";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {Progress_cardComponent} from "../../../shared/progress_card/progress_card.component";
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
    fName: ['', Validators.required],
    lName: [''],
    doj: ['', Validators.required],
    emailId: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    docId: ['', Validators.required],
    city: ['', Validators.required],
    state: [''],
    speciality: ['', Validators.required],
    image: ['']
  });

  image_url = signal('')

  show = signal(false);
  msg_text = signal('');
  warn = signal(false);
  success = signal(false)

  ipfs: KuboRPCClient;

  selectedDocImage: File | null = null;

  constructor(
    private ds: DoctorService
  ) {
    this.ipfs = ds.ipfs
  }

  ngOnInit(): void {
    this.ipfs = this.ds.ipfs
  }

  async onAddDocSubmit() {
    this.show.set(true);
    this.msg_text.set('Adding Doctor to the Network....');
    this.warn.set(false);
    this.success.set(false)

    if (this.selectedDocImage) {
      const imageHash = await this.ds.addDocImage(this.selectedDocImage);
      this.doctorForm.controls.image.setValue(imageHash.path)
    } else {
      this.doctorForm.controls.image.setValue('')
    }


    this.ds.addDoctor(this.doctorForm.value).then((_r: any) => {
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


  async PreviewImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      const resizedBlob = await this.resizeProfileImage(event.target.files[0]);
      this.selectedDocImage = new File([resizedBlob], "DoctorProfileImage.png", {
        type: resizedBlob.type,
        lastModified: Date.now()
      });
      this.image_url.set(URL.createObjectURL(resizedBlob));
    }
  }

  async resizeProfileImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return

        const TARGET_SIZE = 150;

        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        // Maintain aspect ratio WITHOUT cropping
        const scale = Math.max(
          TARGET_SIZE / img.width,
          TARGET_SIZE / img.height
        );

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        const x = (TARGET_SIZE - newWidth) / 2;
        const y = (TARGET_SIZE - newHeight) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, x, y, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject('Failed to resize image');
              return;
            }

            resolve(blob);
          },
          'image/jpeg',
          0.95
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  onClose() {
    this.show.set(false);
    this.warn.set(false);
  }

  protected validateDocId() {
    return this.doctorForm.controls.docId.value?.length != 42;
  }
}
