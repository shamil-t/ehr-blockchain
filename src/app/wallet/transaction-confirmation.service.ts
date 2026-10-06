import {Injectable, signal} from '@angular/core';
import type {TransactionConfirmation} from './components/transaction-confirmation/transaction-confirmation.component';

@Injectable({providedIn: 'root'})
export class TransactionConfirmationService {
  readonly transaction = signal<TransactionConfirmation | null>(null);

  private resolveConfirmation: ((confirmed: boolean) => void) | null = null;

  requestConfirmation(transaction: TransactionConfirmation): Promise<boolean> {
    if (this.resolveConfirmation) {
      throw new Error('A transaction confirmation is already in progress.');
    }

    return new Promise<boolean>(resolve => {
      this.resolveConfirmation = resolve;
      this.transaction.set(transaction);
    });
  }

  confirm(): void {
    this.resolve(true);
  }

  cancel(): void {
    this.resolve(false);
  }

  private resolve(confirmed: boolean): void {
    const resolveConfirmation = this.resolveConfirmation;
    if (!resolveConfirmation) return;

    this.resolveConfirmation = null;
    this.transaction.set(null);
    resolveConfirmation(confirmed);
  }
}
