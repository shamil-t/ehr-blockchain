import { Component, effect, OnInit } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  account: any;

  isConnected: boolean = false;

  load_text: string = 'Connecting to BlockChain....';

  retry_visibility: boolean = false;

  constructor(private blockChainService: BlockchainService) {
    effect(() => {
      console.log(blockChainService.account());

      this.account = this.blockChainService.account()
    });
  }

  ngOnInit(): void {
    this.connectWithContract();
  }

  reload() {
    this.connectWithContract();
  }

  connectWithContract() {
    this.blockChainService.getContract().then(c => {
      if (c) {
        this.isConnected = true;
      } else {
        this.isConnected = false;
        this.load_text =
          'Unable to connect to BlockChain \n ' +
          'Please Open Ganache and Connect to MetaMask';
        this.retry_visibility = true;
      }
    }).catch(err => {
      console.log(err)
      this.isConnected = false;
      this.load_text =
        'Unable to connect to BlockChain \n ' +
        'Please Open Ganache and Connect to MetaMask';
      this.retry_visibility = true;
    })
  }
}
