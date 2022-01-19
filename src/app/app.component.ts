import { Component, OnInit } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';
import Web3 from 'web3';

declare let window: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent implements OnInit {
  title = 'ehr-2.0';

  provider: any;
  web3js: any;
  netId: any;
  accounts: any;

  isConnected: boolean = false;

  load_text: string = 'Connecting to BlockChain....';

  retry_visibility: boolean = false;

  constructor(private blockChainService: BlockchainService) {}

  ngOnInit(): void {
    this.load();
  }

  reload() {
    this.load();
  }

  load() {
    console.log('loading....');
    this.blockChainService.getWeb3Provider().then((result: Web3) => {
      console.log(result);
      this.accounts = result.eth.getAccounts((err, accs) => {
        if(accs[0] != null){
          this.accounts = accs[0]
          this.isConnected = true;
        }
        else {
          setTimeout(() => {
            this.isConnected = false;
            this.load_text =
              'Unable to connect to BlockChain \n ' +
              'Please Open Ganache and Connect to MetaMask';
            this.retry_visibility = true;
          }, 5000);
        }
        return accs;
      });
    });
  }
}
