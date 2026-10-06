export type FeedbackType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'progress';

export interface ToastMessage {
  id: number;
  type: Exclude<FeedbackType, 'loading' | 'progress'>;
  message: string;
  title?: string;
  duration?: number;
}

export interface LoadingState {
  active: boolean;
  message?: string;
}

export interface ProgressState {
  active: boolean;
  value: number;
  message?: string;
}

export interface UiFeedbackState {
  loading: LoadingState;
  progress: ProgressState;
  toasts: ToastMessage[];
}
