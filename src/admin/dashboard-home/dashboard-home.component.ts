import { Component, OnInit, effect } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.sass']
})
export class DashboardHomeComponent implements OnInit {

  Titles: any = ['Total Patients', 'In Patients', 'Active Doctors', 'Active Nurses']
  Images: any = ['user-injured', 'procedures', 'user-md', 'user-nurse']
  Count: number = 0
  Background: any = ['green', 'orange', 'blue', 'violet']

  accountBalance: any;

  constructor(blockchainService: BlockchainService) {
    effect(() => {

      this.accountBalance = blockchainService.balance()
      console.log(this.accountBalance);

    })
  }

  ngOnInit(): void {

  }





}
