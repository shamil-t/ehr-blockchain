import {Component, inject, OnInit, signal} from '@angular/core';
import {CardComponent} from "./card/card.component";
import {CurrencyPipe} from "@angular/common";
import {WalletService} from "../../services/wallet.service";


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [
    CardComponent,
    CurrencyPipe
  ],
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {

  Titles: any = ['Total Patients', 'In Patients', 'Active Doctors', 'Active Nurses']
  Images: any = ['user-injured', 'procedures', 'user-md', 'user-nurse']
  Count: number = 0
  Background: any = ['green', 'orange', 'blue', 'violet']

  accountBalance = signal('0.00');

  walletService = inject(WalletService);

  constructor() {

  }

  ngOnInit(): void {
    this.walletService.getAccountBalance().then(balance => {
      this.accountBalance.set(balance);
    })
  }


}
