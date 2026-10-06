import {Component, DestroyRef, ElementRef, HostListener, inject, OnInit, signal, ViewChild} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {EhrWalletService} from '../ehr-wallet.service';
import {ProviderService} from '../provider.service';
import {WalletState} from '../wallet-state.enum';
import {TransactionConfirmationService} from '../transaction-confirmation.service';
import {ActivatedRoute, Router} from '@angular/router';

type WalletDialog =
  'create'
  | 'import'
  | 'import-confirm'
  | 'unlock'
  | 'sign-out'
  | 'sign'
  | 'signed'
  | 'send'
  | 'transaction'
  | 'created';
type TransactionState = 'IDLE' | 'CONFIRMING' | 'SIGNING' | 'SUBMITTING' | 'SUCCESS' | 'ERROR' | 'CANCELLED';

@Component({
  selector: 'app-wallet-page',
  imports: [DecimalPipe, FormsModule],
  styleUrl: './wallet-page.component.sass',
  templateUrl: './wallet-page.component.html',
})
export class WalletPageComponent implements OnInit {
  readonly walletService = inject(EhrWalletService);
  readonly providerService = inject(ProviderService);
  readonly transactionConfirmationService = inject(TransactionConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly WalletState = WalletState;
  readonly balance = signal<string | null>(null);
  readonly balanceError = signal(false);
  readonly walletResult = signal<'created' | 'imported'>('created');
  readonly dialog = signal<WalletDialog | null>(null);
  readonly busyAction = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly copied = signal(false);
  readonly transactionState = signal<TransactionState>('IDLE');
  password = '';
  confirmPassword = '';
  privateKey = '';
  detectedImportAddress = '';
  unlockPassword = '';
  message = 'Verify ownership of EHR wallet';
  toAddress = '';
  valueEth = '';
  signature = '';
  transactionHash = '';
  showPassword = false;
  showConfirmPassword = false;
  showPrivateKey = false;
  @ViewChild('walletDialog') private dialogElement?: ElementRef<HTMLElement>;
  private previousFocus: HTMLElement | null = null;

  get walletAddress(): string | null {
    return this.walletService.address();
  }

  get canWrite(): boolean {
    return this.walletService.state() === WalletState.UNLOCKED &&
      this.providerService.status() === 'CONNECTED' &&
      !this.busyAction();
  }

  get passwordMeetsRequirements(): boolean {
    return this.password.length >= 12;
  }

  get passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  async ngOnInit(): Promise<void> {
    try {
      await Promise.all([this.walletService.initialize(), this.providerService.checkStatus()]);
      await this.refreshBalance();
      this.route.queryParamMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          if (params.get('unlock') !== 'true') return;
          if (this.walletService.state() === WalletState.LOCKED) this.openDialog('unlock');
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {unlock: null},
            queryParamsHandling: 'merge',
            replaceUrl: true
          });
        });
    } catch {
      this.errorMessage.set('Wallet information could not be loaded.');
    }
  }

  passwordStrength(): number {
    if (!this.password) return 0;
    let score = 0;
    if (this.password.length >= 12) score++;
    if (this.password.length >= 16) score++;
    if (/[a-z]/.test(this.password) && /[A-Z]/.test(this.password)) score++;
    if (/\d/.test(this.password)) score++;
    if (/[^a-zA-Z0-9]/.test(this.password)) score++;
    return Math.min(score, 4);
  }

  strengthLabel(): string {
    return ['Not set', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength()];
  }

  shortenAddress(address: string | null): string {
    return address && address.length > 14 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address ?? '';
  }

  openDialog(dialog: WalletDialog): void {
    if (!this.dialog()) this.previousFocus = document.activeElement as HTMLElement | null;
    this.errorMessage.set('');
    this.dialog.set(dialog);
    this.focusDialog();
  }

  closeDialog(): void {
    if (this.busyAction()) return;
    this.clearSecrets();
    this.errorMessage.set('');
    this.dialog.set(null);
    this.transactionState.set('IDLE');
    window.setTimeout(() => this.previousFocus?.focus(), 0);
  }

  @HostListener('document:keydown', ['$event'])
  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.dialog()) return;
    const focusable = this.dialogElement?.nativeElement.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async refreshNetwork(): Promise<void> {
    await this.providerService.checkStatus();
    await this.refreshBalance();
  }

  async refreshBalance(): Promise<void> {
    if (!this.walletAddress || this.providerService.status() !== 'CONNECTED') {
      this.balance.set(null);
      this.balanceError.set(false);
      return;
    }
    try {
      this.balance.set(await this.walletService.getBalance());
      this.balanceError.set(false);
    } catch {
      this.balance.set(null);
      this.balanceError.set(true);
    }
  }

  async copyText(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 1800);
    } catch {
      this.errorMessage.set('Clipboard access is unavailable in this browser.');
    }
  }

  async createWallet(): Promise<void> {
    if (!this.passwordMeetsRequirements || !this.passwordsMatch || this.busyAction()) return;
    this.busyAction.set('create');
    this.errorMessage.set('');
    try {
      await this.walletService.createWallet(this.password);
      this.walletResult.set('created');
      this.clearSecrets();
      this.openDialog('created');
      await this.refreshBalance();
    } catch {
      this.errorMessage.set('The wallet could not be created. Please try again.');
    } finally {
      this.busyAction.set(null);
    }
  }

  prepareImport(): void {
    if (!this.privateKey || !this.passwordMeetsRequirements || !this.passwordsMatch) return;
    try {
      this.detectedImportAddress = this.walletService.validatePrivateKey(this.privateKey);
      this.openDialog('import-confirm');
    } catch {
      this.errorMessage.set('The private key is invalid.');
    }
  }

  async confirmImport(): Promise<void> {
    const privateKey = this.privateKey;
    if (!privateKey || this.busyAction()) return;
    this.privateKey = '';
    this.showPrivateKey = false;
    this.busyAction.set('import');
    this.errorMessage.set('');
    try {
      await this.walletService.importWalletFromPrivateKey(privateKey, this.password);
      this.walletResult.set('imported');
      this.clearSecrets();
      this.openDialog('created');
      await this.refreshBalance();
    } catch {
      this.clearSecrets();
      this.openDialog('import');
      this.errorMessage.set('The wallet could not be imported. Check the private key and try again.');
    } finally {
      this.busyAction.set(null);
    }
  }

  async unlockWallet(): Promise<void> {
    if (!this.unlockPassword || this.busyAction()) return;
    this.busyAction.set('unlock');
    this.errorMessage.set('');
    try {
      await this.walletService.unlock(this.unlockPassword);
      this.unlockPassword = '';
      this.dialog.set(null);
      await this.refreshBalance();
    } catch {
      this.errorMessage.set('Incorrect wallet password.');
    } finally {
      this.busyAction.set(null);
    }
  }

  lockWallet(): void {
    this.walletService.lock();
    this.closeDialog();
  }

  async signOutWallet(): Promise<void> {
    if (this.busyAction()) return;
    this.busyAction.set('sign-out');
    this.errorMessage.set('');
    let signedOut = false;
    try {
      await this.walletService.signOut();
      this.balance.set(null);
      this.balanceError.set(false);
      this.transactionState.set('IDLE');
      signedOut = true;
    } catch {
      this.errorMessage.set('The wallet could not be signed out. Please try again.');
    } finally {
      this.busyAction.set(null);
    }
    if (signedOut) this.closeDialog();
  }

  async signMessage(): Promise<void> {
    if (!this.message.trim() || !this.canWrite) return;
    this.busyAction.set('sign');
    this.errorMessage.set('');
    try {
      this.signature = await this.walletService.signMessage(this.message.trim());
      this.openDialog('signed');
    } catch {
      this.errorMessage.set('The message could not be signed.');
    } finally {
      this.busyAction.set(null);
    }
  }

  async prepareTransaction(): Promise<void> {
    const from = this.walletAddress;
    if (!this.canWrite || !from || !this.toAddress || !this.valueEth) return;
    try {
      this.toAddress = this.walletService.validateAddress(this.toAddress.trim());
      if (!Number.isFinite(Number(this.valueEth)) || Number(this.valueEth) < 0) {
        this.errorMessage.set('Enter a valid transaction amount.');
        return;
      }

      const estimate = this.walletService.estimateTransactionDetails
        ? await this.walletService.estimateTransactionDetails(this.toAddress, this.valueEth)
        : {
            value: 0n,
            gasLimit: 21000n,
            estimatedFee: 0n,
          };

      this.errorMessage.set('');
      this.transactionState.set('CONFIRMING');
      this.openDialog('transaction');

      void this.transactionConfirmationService.requestConfirmation({
        operation: 'Send transaction',
        from,
        to: this.toAddress,
        chainId: this.providerService.chainId() ?? this.providerService.expectedChainId,
        network: this.providerService.networkName,
        value: estimate.value,
        gasLimit: estimate.gasLimit,
        estimatedFee: estimate.estimatedFee,
      }).then((confirmed) => {
        if (!confirmed) {
          this.transactionState.set('CANCELLED');
          return;
        }
        void this.confirmTransaction();
      }).catch(() => {
        this.transactionState.set('ERROR');
        this.errorMessage.set('The transaction details could not be prepared or confirmed.');
      });
    } catch {
      this.errorMessage.set('The transaction details could not be prepared or confirmed.');
    }
  }

  async confirmTransaction(): Promise<void> {
    if (this.transactionState() !== 'CONFIRMING' || !this.canWrite) return;
    this.transactionState.set('SIGNING');
    this.busyAction.set('transaction');
    this.errorMessage.set('');
    try {
      await Promise.resolve();
      this.transactionState.set('SUBMITTING');
      this.transactionHash = await this.walletService.sendTransaction(this.toAddress, this.valueEth);
      this.transactionState.set('SUCCESS');
    } catch {
      this.transactionState.set('ERROR');
      this.errorMessage.set('The transaction could not be submitted.');
    } finally {
      this.busyAction.set(null);
    }
  }

  async retryTransaction(): Promise<void> {
    this.dialog.set(null);
    this.transactionState.set('IDLE');
    await this.prepareTransaction();
  }

  private clearSecrets(): void {
    this.password = '';
    this.confirmPassword = '';
    this.privateKey = '';
    this.detectedImportAddress = '';
    this.unlockPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.showPrivateKey = false;
  }

  private focusDialog(): void {
    window.setTimeout(() => {
      this.dialogElement?.nativeElement.querySelector<HTMLElement>(
        'input:not(:disabled), textarea:not(:disabled), button:not(:disabled)'
      )?.focus();
    }, 0);
  }
}
