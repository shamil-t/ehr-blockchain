import {Component, inject} from '@angular/core';
import {UiFeedbackService} from "../../services/ui-feedback.service";
import {NgbProgressbar, NgbToast} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-ui-feedback',
  imports: [
    NgbToast,
    NgbProgressbar
  ],
  templateUrl: './ui-feedback.component.html',
  styleUrl: './ui-feedback.component.sass',
})
export class UiFeedbackComponent {
  readonly ui = inject(UiFeedbackService);

  readonly loading = this.ui.loading;

  readonly progress = this.ui.progress;

  readonly toasts = this.ui.toasts;

  removeToast(id: number): void {
    this.ui.removeToast(id);
  }
}
