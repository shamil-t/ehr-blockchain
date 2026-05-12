import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {BlockchainService} from "../../services/blockchain.service";
import {Progress_cardComponent} from "../../utils/progress_card/progress_card.component";
import {HeaderComponent} from "./header/header.component";
import {SidebarComponent} from "./sidebar/sidebar.component";

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.sass'],
  imports: [
    Progress_cardComponent,
    HeaderComponent,
    SidebarComponent,
    RouterOutlet
  ]
})
export class AdminDashboardComponent implements OnInit {
  router = inject(Router);
  bs = inject(BlockchainService)
  isCollapse: boolean = true;

  account: string = '';
  isAdmin = signal(false);

  checkProgress = signal(true);
  progressWarn = signal(false);
  progressMsg = signal('Checking Admin....');

  constructor() {
    effect(() => {
      if (this.account != this.bs.account()) {
        this.account = this.bs.account();
        this.onCheckAdmin()
      }
    });
  }

  ngOnInit(): void {

  }

  onCheckAdmin() {
    this.progressMsg.set('Checking Admin Access...')
    this.progressWarn.set(false)
    this.bs.checkIsAdmin().then(r => {
      this.isAdmin.set(r)
      console.log(this.isAdmin())
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
}
