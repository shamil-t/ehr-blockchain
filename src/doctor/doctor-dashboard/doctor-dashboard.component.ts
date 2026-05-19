import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Progress_cardComponent} from "../../shared/progress_card/progress_card.component";
import {WalletService} from "../../services/wallet.service";
import {EhrContractService} from "../../services/ehr-contract.service";
import {SidebarComponent} from "../../shared/sidebar/sidebar.component";
import {SidebarMenuItem} from "../../types/sidebar-menu.type";

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.sass'],
  imports: [
    Progress_cardComponent,
    SidebarComponent,
    RouterOutlet,
    SidebarComponent
  ]
})
export class DoctorDashboardComponent implements OnInit {
  isDoctor = signal(false);

  isCollapse = signal(false);

  checkProgress = signal(true);
  progressWarn = signal(false);
  progressMsg = signal('Checking Doctor....');

  walletService = inject(WalletService);
  ehrContractService = inject(EhrContractService);
  router: Router = inject(Router);
  account = ''
  protected sidebarNavMenus: SidebarMenuItem[] = [];

  constructor() {
    effect(() => {
      if (this.account != this.walletService.connectedAccount()) {
        this.account = this.walletService.connectedAccount();
        this.onCheckDoctor().then(_r => {
        })
      }
    });
  }

  ngOnInit(): void {
    this.onCheckDoctor().then(_ => {
    });

    let menu: SidebarMenuItem = {
      name: 'Management',
      menuItems: [
        {icon: 'fa-home', label: 'Dashboard', routerLink: '/doctor/dashboard', active: true},
        {icon: 'fa-notes-medical', label: 'View Record', routerLink: '/doctor/view-record', active: false},
        {icon: 'fa-user-injured', label: 'Consultation', routerLink: '/doctor/consult', active: false}
      ]
    }

    this.sidebarNavMenus.push(menu)
  }

  async onCheckDoctor() {
    this.checkProgress.set(true);
    this.progressWarn.set(false);
    this.progressMsg.set('Checking Doctor....');

    this.isDoctor.set(await this.ehrContractService.isDoctor())

    if (this.isDoctor()) {
      this.router.navigate(['/doctor/dashboard']).then(_r => {
        // console.log("Routing to Doctor Dashboard");
      });
    } else {
      this.progressWarn.set(true);
      this.progressMsg.set('<p class="small"><span class="text-danger">Only doctor have Access to this Page.... </span><br> ' +
        'Connect MetaMask to your Doctor account</p>')
    }
  }

  protected exitProgress() {
    this.router.navigate(['']).then(_r => {
    });
  }
}
