import {Component, inject, OnInit, signal} from '@angular/core';
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

  isAdmin = signal(false);

  checkProgress: boolean = true;
  progressWarn: boolean = false
  progressMsg: string = 'Checking Admin....';

  constructor() {

  }

  ngOnInit(): void {
    this.onCheckAdmin()
    this.router.navigate(['admin/dashboard']).then(_ => {
    });
  }

  onCheckAdmin() {
    this.progressMsg = 'Checking Admin Access...'
    this.progressWarn = false
    // console.log("check admin");

    this.bs.checkIsAdmin().then(r => {
      // console.log(r);
      if (r) {
        this.isAdmin.set(true)
      }
    }).catch((er: any) => {
      this.checkProgress = false
      this.progressWarn = true
      this.progressMsg = '<span class="text-danger">Only admin have Access to this Page.... </span><br> ' +
        'Connect MetaMask to your Admin account'
    })
  }
}
