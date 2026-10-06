import {Component, EventEmitter, Input, Output} from '@angular/core';

export interface TransactionConfirmation {
  operation: string;
  from: string;
  to?: string;
  chainId: bigint | number;
  network: string;
  value: bigint;
  gasLimit?: bigint;
  estimatedFee?: bigint;
  currencySymbol?: string;
  currencyDecimals?: number;
}

@Component({
  selector: 'app-transaction-confirmation',
  templateUrl: './transaction-confirmation.component.html',
  styleUrl: './transaction-confirmation.component.css',
})
export class TransactionConfirmationComponent {
  @Input({required: true})
  transaction!: TransactionConfirmation;

  @Output()
  confirmed = new EventEmitter<void>();

  @Output()
  cancelled = new EventEmitter<void>();

  formatAmount(value: bigint | undefined): string {
    if (value === undefined) return 'Not provided';

    const decimals = this.transaction.currencyDecimals ?? 18;
    const symbol = this.transaction.currencySymbol ?? 'ETH';
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
      return `${this.formatInteger(value)} base units`;
    }

    const negative = value < 0n;
    const absoluteValue = negative ? -value : value;
    const digits = absoluteValue.toString().padStart(decimals + 1, '0');
    const whole = decimals === 0 ? digits : digits.slice(0, -decimals);
    const fraction = decimals === 0 ? '' : digits.slice(-decimals).replace(/0+$/, '');
    const amount = `${negative ? '-' : ''}${this.formatInteger(BigInt(whole))}` +
      (fraction ? `.${fraction}` : '');

    return `${amount} ${symbol}`;
  }

  formatInteger(value: bigint): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
