import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {WalletService} from "../../services/wallet.service";
import {EhrContractService} from "../../services/ehr-contract.service";
import {SidebarComponent} from "../../shared/sidebar/sidebar.component";
import {SidebarMenuItem} from "../../types/sidebar-menu.type";
import {UiFeedbackService} from "../../services/ui-feedback.service";

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.sass'],
  imports: [
    SidebarComponent,
    RouterOutlet,
    SidebarComponent
  ]
})
export class DoctorDashboardComponent implements OnInit {
  isDoctor = signal(false);

  checkProgress = signal(true);
  progressWarn = signal(false);
  progressMsg = signal('Checking Doctor....');

  walletService = inject(WalletService);
  ehrContractService = inject(EhrContractService);
  uiFeedbackService = inject(UiFeedbackService);

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
    // this.onCheckDoctor().then(_ => {
    // });

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
    this.uiFeedbackService.showLoader("Checking Doctor...");
    this.isDoctor.set(await this.ehrContractService.isDoctor())
    if (this.isDoctor()) {
      this.uiFeedbackService.success("Doctor Authenticated successfully!");
      this.uiFeedbackService.hideLoader();
      this.router.navigate(['/doctor/dashboard']).then(_r => {
      });
    } else {
      this.uiFeedbackService.hideLoader();
      this.uiFeedbackService.error("Doctor Authentication failed!");
      this.router.navigate(['']).then(_r => {
      })
    }
  }

}
