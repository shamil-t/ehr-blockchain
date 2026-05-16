import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {EhrContractService} from "../services/ehr-contract.service";
import {WalletService} from "../services/wallet.service";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  walletService: WalletService = inject(WalletService);
  ehrContractService = inject(EhrContractService);
  account = signal('')
  isConnected = signal(false);
  load_text = signal('Connecting to BlockChain....');
  retry_visibility = signal(false);

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
    this.connectWithContract();
  }

  reload() {
    this.connectWithContract();
  }

  connectWithContract() {
    this.ehrContractService.validateContract().then(x => {
      this.isConnected.set(x);
    }).catch(err => {
      console.log(err)
      this.isConnected.set(false);
      this.load_text.set(
        'Unable to connect to BlockChain \n ' +
        err.toString()
      )
      this.retry_visibility.set(true);
    })
  }
}
