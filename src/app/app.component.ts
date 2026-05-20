import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {EhrContractService} from "./services/ehr-contract.service";
import {WalletService} from "./services/wallet.service";
import {UiFeedbackComponent} from "./shared/ui-feedback/ui-feedback.component";
import {UiFeedbackService} from "./services/ui-feedback.service";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  imports: [RouterOutlet, UiFeedbackComponent]
})
export class AppComponent implements OnInit {
  uiFeedbackService = inject(UiFeedbackService);
  walletService: WalletService = inject(WalletService);
  ehrContractService = inject(EhrContractService);
  account = signal('')
  // isConnected = signal(false);
  // load_text = signal('Connecting to BlockChain....');
  // retry_visibility = signal(false);

  constructor() {
    effect(() => {
      this.account = this.walletService.connectedAccount
      if (this.account() == '') {
        this.walletService.getConnectedAccount().then((_) => {
        })
      }
    });
  }

  ngOnInit(): void {
    this.uiFeedbackService.showLoader("Loading...");
    this.connectWithContract();
  }

  reload() {
    this.connectWithContract();
  }

  connectWithContract() {
    this.ehrContractService.validateContract().then(_x => {
      // this.isConnected.set(x);
      this.uiFeedbackService.hideLoader()
    }).catch(err => {
      console.log(err)
      // this.isConnected.set(false);
      this.uiFeedbackService.error("Failed to connect to BlockChain.... \n" + err.toString());
      // this.load_text.set(
      //   'Unable to connect to BlockChain \n ' +
      //   err.toString()
      // )
      // this.retry_visibility.set(true);
    })
  }
}
