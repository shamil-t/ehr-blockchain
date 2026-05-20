import {computed, Injectable, signal} from '@angular/core';
import {ToastMessage, UiFeedbackState} from "../shared/ui-feedback/ui-feedback.model";

@Injectable({
  providedIn: 'root',
})
export class UiFeedbackService {
  private readonly initialState: UiFeedbackState = {
    loading: {
      active: false
    },
    progress: {
      active: false,
      value: 0
    },
    toasts: []
  };

  private readonly state = signal<UiFeedbackState>(
    this.initialState
  );

  readonly loading = computed(() => this.state().loading);

  readonly progress = computed(() => this.state().progress);

  readonly toasts = computed(() => this.state().toasts);

  private toastId = 0;

  // =========================
  // LOADING
  // =========================

  showLoader(message = 'Loading...'): void {

    this.state.update(state => ({
      ...state,
      loading: {
        active: true,
        message
      }
    }));
  }

  hideLoader(): void {

    this.state.update(state => ({
      ...state,
      loading: {
        active: false
      }
    }));
  }

  // =========================
  // PROGRESS
  // =========================

  showProgress(
    value: number,
    message = 'Processing...'
  ): void {

    this.state.update(state => ({
      ...state,
      progress: {
        active: true,
        value,
        message
      }
    }));
  }

  hideProgress(): void {

    this.state.update(state => ({
      ...state,
      progress: {
        active: false,
        value: 0
      }
    }));
  }

  // =========================
  // TOASTS
  // =========================

  success(message: string, title = 'Success'): void {
    this.addToast('success', message, title);
  }

  error(message: string, title = 'Error'): void {
    this.addToast('error', message, title);
  }

  warning(message: string, title = 'Warning'): void {
    this.addToast('warning', message, title);
  }

  info(message: string, title = 'Info'): void {
    this.addToast('info', message, title);
  }

  removeToast(id: number): void {

    this.state.update(state => ({
      ...state,
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }

  private addToast(
    type: ToastMessage['type'],
    message: string,
    title: string,
    duration = 4000
  ): void {

    const toast: ToastMessage = {
      id: ++this.toastId,
      type,
      title,
      message,
      duration
    };

    this.state.update(state => ({
      ...state,
      toasts: [...state.toasts, toast]
    }));

    setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);
  }
}
