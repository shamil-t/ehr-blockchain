import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {Progress_cardComponent} from "../../shared/progress_card/progress_card.component";
import {HeaderComponent} from "./header/header.component";
import {SidebarComponent} from "./sidebar/sidebar.component";
import {WalletService} from "../../services/wallet.service";
import {EhrContractService} from "../../services/ehr-contract.service";

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.sass'],
  imports: [
    Progress_cardComponent,
    HeaderComponent,
    SidebarComponent,
    RouterOutlet
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
    this.onCheckDoctor().then(_ =>{});
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
