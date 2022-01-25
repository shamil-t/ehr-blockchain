import { Component, OnInit } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.sass']
})
export class DashboardHomeComponent implements OnInit {

  Titles: any = ['Total Patients','In Patients','Active Doctors','Active Nurses']
  Images: any = ['user-injured','procedures','user-md','user-nurse']
  Count: number = 0
  Background: any = ['green','orange','blue','violet']

  accountBalance: any;

  constructor(private blockchainService: BlockchainService) { }

  ngOnInit(): void {
    this.accountBalance = this.blockchainService.getBalance()
    console.log(this.accountBalance);

    let getBalance = setInterval(() => {
      this.accountBalance = this.blockchainService.getBalance()
      if(this.accountBalance != null){
        this.accountBalance /= 1000000000000000000
        console.log("Balance",this.accountBalance);
        clearInterval(getBalance);
      }
    },1000)
  }


  
  

}
