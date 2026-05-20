import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {SidebarComponent} from "../../shared/sidebar/sidebar.component";
import {EhrContractService} from "../../services/ehr-contract.service";
import {WalletService} from "../../services/wallet.service";
import {SidebarMenuItem} from "../../../types/sidebar-menu.type";
import {UiFeedbackService} from "../../services/ui-feedback.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass'],
  imports: [
    SidebarComponent,
    RouterOutlet
  ]
})
export class DashboardComponent implements OnInit {
  router = inject(Router);
  uiFeedbackService = inject(UiFeedbackService);

  walletService = inject(WalletService);
  ehrService = inject(EhrContractService)

  sidebarMenus: SidebarMenuItem[] = []

  account: string = '';
  isAdmin = signal(false);

  constructor() {
    effect(() => {
      this.walletService.connectedAccount()
      this.checkIsConnectedAsAdminAccount()
    });
  }

  ngOnInit(): void {
    // this.checkIsConnectedAsAdminAccount()

    let menu: SidebarMenuItem = {
      name: 'Management',
      menuItems: [
        {icon: 'fa-home', label: 'Dashboard', routerLink: '/admin/dashboard', active: true},
        {icon: 'fa-user-doctor', label: 'Doctor', routerLink: '/admin/doctor', active: false}
      ]
    }
    this.sidebarMenus.push(menu)
  }

  checkIsConnectedAsAdminAccount() {
    // this.uiFeedbackService.showProgress(0, "Checking Admin Access...")
    this.uiFeedbackService.showLoader("Checking Admin Access...")
    // this.progressMsg.set('')
    // this.progressWarn.set(false)
    this.ehrService.isAdmin().then(r => {
      this.isAdmin.set(r)
      // console.log(this.isAdmin())
      if (!this.isAdmin()) {
        // this.showProgress()
        // this.uiFeedbackService.hideProgress()
        this.uiFeedbackService.error("Not connected as Admin, Connect MetaMask to admin account");
        this.router.navigate(['']).then(() => {
        });
      } else {
        this.uiFeedbackService.success("Admin validated successfully.");
        this.router.navigate(['admin/dashboard']).then(_ => {
        });
      }
    })
    this.uiFeedbackService.hideLoader()
  }


  protected exitProgress() {
    this.router.navigate(['']).then(_r => {
    })
  }
}
