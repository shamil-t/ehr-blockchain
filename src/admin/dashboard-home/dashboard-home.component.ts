import {Component, inject, OnInit, signal} from '@angular/core';
import {BlockchainService} from 'src/services/blockchain.service';
import {CardComponent} from "./card/card.component";
import {CurrencyPipe} from "@angular/common";


@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  imports: [
    CardComponent,
    CurrencyPipe
  ],
  styleUrls: ['./dashboard-home.component.sass']
})
export class DashboardHomeComponent implements OnInit {
  bs = inject(BlockchainService);

  Titles: any = ['Total Patients', 'In Patients', 'Active Doctors', 'Active Nurses']
  Images: any = ['user-injured', 'procedures', 'user-md', 'user-nurse']
  Count: number = 0
  Background: any = ['green', 'orange', 'blue', 'violet']

  accountBalance = signal('0.00');

  constructor() {

  }

  ngOnInit(): void {
    this.bs.getBalanceByAccount().then(balance => {
      this.accountBalance.set(balance);
    })
  }


}
