import { Component, OnInit } from '@angular/core';
import { BlockchainService } from 'services/blockchain.service';
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
  netId:any
  accounts: any = [];

  constructor(private blockChainService: BlockchainService) {
    
  }

  ngOnInit(): void {
    this.load()
    
  }

  async load(){
    await this.blockChainService.loadBlockChain().then(async () => {
      await this.blockChainService.loadBlockChain();
      this.netId = this.blockChainService.netId
      this.accounts = this.blockChainService.accounts
    });
    
  }


}
