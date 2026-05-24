import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {SidebarComponent} from "../../shared/sidebar/sidebar.component";
import {Router, RouterOutlet} from "@angular/router";
import {SidebarMenuItem} from "../../../types/sidebar-menu.type";
import {WalletService} from "../../services/wallet.service";
import {EhrContractService} from "../../services/ehr-contract.service";
import {User} from "../../../enums/user.enum";

@Component({
  selector: 'app-dashboard',
  imports: [
    SidebarComponent,
    RouterOutlet
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.sass',
})
export class DashboardComponent implements OnInit {

  router = inject(Router)
  navs: SidebarMenuItem[] = [];
  isPatient = signal(false)
  ehrContractService = inject(EhrContractService)
  walletService = inject(WalletService);
  private account: string = '';

  constructor() {
    effect(() => {

      if (this.walletService.connectedAccount() != this.account) {
        this.account = this.walletService.connectedAccount();
        this.checkIsConnectedAsPatient()
      }

    });
  }

  ngOnInit() {

  }

  checkIsConnectedAsPatient() {

    this.ehrContractService.isPatient().then(r => {
      this.isPatient.set(r)
      if (!this.isPatient()) {
        this.ehrContractService.getUserType().then(userType => {
          console.log(userType)
          if (userType == User.NONE) {
            // TODO // provide feedback to register
            this.router.navigate(['register']).then(() => {
            })
          } else {
            // TODO: provide feedback
            // User already have a role
            this.router.navigate(['']).then(() => {

            })
          }
        })
      } else {
        this.setNavigation()
      }
    })
  }

  setNavigation() {
    let menu: SidebarMenuItem = {
      name: 'Management',
      menuItems: [
        {icon: 'fa-home', label: 'Dashboard', routerLink: '/patient/dashboard', active: true},
        {icon: 'fa-notes-medical', label: 'View Record', routerLink: '/patient/view-record', active: false},
        {icon: 'fa-calendar-plus', label: 'Appointments', routerLink: '/patient/appointments', active: false}
      ]
    }

    this.navs.push(menu)
  }
}
