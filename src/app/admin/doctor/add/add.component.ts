import {Component, inject, OnDestroy, signal, ChangeDetectionStrategy} from '@angular/core';
import {DoctorService} from '../../services/doctor.service';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgOptimizedImage} from "@angular/common";
import {UiFeedbackService} from "../../../services/ui-feedback.service";
import {ProviderService} from "../../../wallet/provider.service";
import {TransactionConfirmationService} from "../../../wallet/transaction-confirmation.service";


@Component({
  selector: 'doctor-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    NgOptimizedImage,
    ReactiveFormsModule
  ]
})
export class AddComponent implements OnDestroy {

  fb = inject(FormBuilder)
  doctorForm = this.fb.group({
    fName: ['', Validators.required],
    lName: [''],
    doj: ['', Validators.required],
    emailId: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    docId: ['', [Validators.required, Validators.pattern(/^0x[a-fA-F0-9]{40}$/)]],
    city: ['', Validators.required],
    state: [''],
    speciality: ['', Validators.required],
    image: ['']
  });

  image_url = signal('')

  uiFeedbackService = inject(UiFeedbackService);
  private readonly providerService = inject(ProviderService);
  private readonly transactionConfirmationService = inject(TransactionConfirmationService);

  selectedDocImage: File | null = null;
  isSubmitting = signal(false);
  private previewUrl = '';

  constructor(private ds: DoctorService) {}

  async onAddDocSubmit(imageInput: HTMLInputElement) {
    if (this.doctorForm.invalid || this.isSubmitting()) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.uiFeedbackService.showLoader("Adding Doctor...")
    this.uiFeedbackService.showProgress(10, "Adding Doctor details to the IPFS...")

    try {
      if (this.selectedDocImage) {
        const imageHash = await this.ds.addDocImage(this.selectedDocImage);
        this.doctorForm.controls.image.setValue(imageHash.path);
      } else {
        this.doctorForm.controls.image.setValue('');
      }

      this.uiFeedbackService.showProgress(50, "");
      const docId = this.doctorForm.controls.docId.value;
      if (!docId) throw new Error('Doctor wallet address is required.');
      const profileHash = await this.ds.prepareDoctor(this.doctorForm.value);
      const estimate = await this.ds.estimateAddDoctorTransaction(docId, profileHash);
      this.uiFeedbackService.hideProgress();
      this.uiFeedbackService.hideLoader();
      const confirmed = await this.transactionConfirmationService.requestConfirmation({
        operation: 'Add doctor',
        from: estimate.from,
        to: estimate.to,
        chainId: this.providerService.chainId() ?? this.providerService.expectedChainId,
        network: this.providerService.networkName,
        value: 0n,
        gasLimit: estimate.gasLimit,
        estimatedFee: estimate.estimatedFee,
      });
      if (!confirmed) return;

      await this.ds.addDoctor(docId, profileHash);
      this.uiFeedbackService.showProgress(99, "Doctor added successfully!")
      this.uiFeedbackService.success("Doctor added successfully!")
      this.doctorForm.reset();
      this.clearImage(imageInput);
    } catch (error) {
      this.uiFeedbackService.error("Failed to add Doctor, " + String(error));
    } finally {
      this.isSubmitting.set(false);
      this.uiFeedbackService.hideProgress();
      this.uiFeedbackService.hideLoader();
    }
  }


  async PreviewImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.uiFeedbackService.error("Please select an image file.");
      input.value = '';
      return;
    }

    try {
      const resizedBlob = await this.resizeProfileImage(file);
      this.selectedDocImage = new File([resizedBlob], "doctor-profile.jpg", {
        type: resizedBlob.type,
        lastModified: Date.now()
      });
      this.releasePreviewUrl();
      this.previewUrl = URL.createObjectURL(resizedBlob);
      this.image_url.set(this.previewUrl);
    } catch (error) {
      this.uiFeedbackService.error("Unable to preview this image, " + String(error));
      input.value = '';
    }
  }

  async resizeProfileImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const sourceUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(sourceUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Unable to process this image.'));
          return;
        }

        const TARGET_SIZE = 150;

        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

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
              reject(new Error('Failed to resize image.'));
              return;
            }

            resolve(blob);
          },
          'image/jpeg',
          0.82
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error('The selected file could not be read as an image.'));
      };
      img.src = sourceUrl;
    });
  }

  clearImage(imageInput: HTMLInputElement) {
    this.selectedDocImage = null;
    this.image_url.set('');
    imageInput.value = '';
    this.releasePreviewUrl();
  }

  ngOnDestroy() {
    this.releasePreviewUrl();
  }

  private releasePreviewUrl() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = '';
    }
  }
}
