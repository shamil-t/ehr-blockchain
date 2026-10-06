import {ChangeDetectionStrategy, Component, effect, inject, OnInit, signal} from '@angular/core';
import {RouterLink, RouterOutlet} from "@angular/router";
import {EhrContractService} from "./services/ehr-contract.service";
import {WalletService} from "./services/wallet.service";
import {UiFeedbackComponent} from "./shared/ui-feedback/ui-feedback.component";
import {UiFeedbackService} from "./services/ui-feedback.service";
import {ProviderService} from "./wallet/provider.service";
import {TransactionConfirmationComponent} from "./wallet/components/transaction-confirmation/transaction-confirmation.component";
import {TransactionConfirmationService} from "./wallet/transaction-confirmation.service";
import {EhrWalletService} from "./wallet/ehr-wallet.service";
import {WalletState} from "./wallet/wallet-state.enum";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, RouterOutlet, UiFeedbackComponent, TransactionConfirmationComponent]
})
export class AppComponent implements OnInit {
  uiFeedbackService = inject(UiFeedbackService);
  provider: ProviderService = inject(ProviderService);
  walletService: EhrWalletService = inject(EhrWalletService);
  ehrContractService = inject(EhrContractService);
  readonly transactionConfirmationService = inject(TransactionConfirmationService);
  readonly WalletState = WalletState;
  // account = signal('')

  constructor() {
    effect(() => {
      // this.account = this.walletService.connectedAccount
      // if (this.account() == '') {
      //   this.walletService.getConnectedAccount().then((_) => {
      //   })
      // }
    });
  }

  ngOnInit(): void {
    this.uiFeedbackService.showLoader("Loading...");
    void this.walletService.initialize();
    void this.provider.checkStatus();
    this.checkProviderAvailable();
  }

  checkProviderAvailable() {
    this.provider.isProviderAvailable().then(isProviderAvailable => {
      if (isProviderAvailable) {
        this.uiFeedbackService.hideLoader();
        this.uiFeedbackService.success("provider available");
      } else {
        this.uiFeedbackService.hideLoader();
        this.uiFeedbackService.error("provider not available");
      }
    })
  }

  // connectWithContract() {
  //   this.ehrContractService.validateContract().then(_x => {
  //     this.uiFeedbackService.hideLoader()
  //     this.uiFeedbackService.success("Contract validated successfully.", "Connected to Wallet");
  //   }).catch(err => {
  //     console.error(err)
  //     this.uiFeedbackService.error("Failed to connect to BlockChain.... \n" + err.toString());
  //   })
  // }
}
