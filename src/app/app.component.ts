import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {BlockchainService} from 'src/services/blockchain.service';
import {RouterOutlet} from "@angular/router";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  imports: [RouterOutlet]
})
export class AppComponent implements OnInit {
  blockChainService = inject(BlockchainService);
  account= signal('')
  isConnected = signal(false);
  load_text = signal('Connecting to BlockChain....');
  retry_visibility = signal(false);

  constructor() {
    effect(() => {
      this.account = this.blockChainService.account
    });
  }

  ngOnInit(): void {
      this.connectWithContract();
  }

  reload() {
    this.connectWithContract();
  }

  connectWithContract() {
    this.blockChainService.getContract().then(_ => {
      this.isConnected.set(true);
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
