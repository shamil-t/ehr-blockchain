import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Progress_cardComponent} from "../../shared/progress_card/progress_card.component";
import {SidebarComponent} from "../../shared/sidebar/sidebar.component";
import {EhrContractService} from "../../services/ehr-contract.service";
import {WalletService} from "../../services/wallet.service";
import {SidebarMenuItem} from "../../types/sidebar-menu.type";

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.sass'],
  imports: [
    Progress_cardComponent,
    SidebarComponent,
    RouterOutlet
  ]
})
export class AdminDashboardComponent implements OnInit {
  router = inject(Router);
  walletService = inject(WalletService);
  ehrService = inject(EhrContractService)
  isCollapse: boolean = true;

  sidebarMenus: SidebarMenuItem[] = []

  account: string = '';
  isAdmin = signal(false);

  checkProgress = signal(true);
  progressWarn = signal(false);
  progressMsg = signal('Checking Admin....');

  constructor() {
    effect(() => {
      this.walletService.connectedAccount()
      this.checkIsConnectedAsAdminAccount()
    });
  }

  ngOnInit(): void {
    this.checkIsConnectedAsAdminAccount()

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
    this.progressMsg.set('Checking Admin Access...')
    this.progressWarn.set(false)
    this.ehrService.isAdmin().then(r => {
      this.isAdmin.set(r)
      // console.log(this.isAdmin())
      if (!this.isAdmin()) {
        this.showProgress()
      } else {
        this.router.navigate(['admin/dashboard']).then(_ => {
        });
      }
    })
  }

  showProgress() {
    this.checkProgress.set(false)
    this.progressWarn.set(true)
    this.progressMsg.set('<span class="text-danger">Only admin have Access to this Page.... </span><br> ' +
      'Connect MetaMask to your Admin account')
  }

  protected exitProgress() {
    this.router.navigate(['']).then(r => {
    })
  }
}
