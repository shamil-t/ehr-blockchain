import {Component, OnInit} from '@angular/core';
import {ViewComponent} from "./view/view.component";
import {AddComponent} from "./add/add.component";
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLinkBase,
  NgbNavLinkButton,
  NgbNavOutlet
} from "@ng-bootstrap/ng-bootstrap/nav";

@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.component.html',
  imports: [
    ViewComponent,
    AddComponent,
    NgbNavLinkBase,
    NgbNavLinkButton,
    NgbNav,
    NgbNavItem,
    NgbNavContent,
    NgbNavOutlet,
  ],
  styleUrls: ['./doctor.component.sass']
})
export class DoctorComponent implements OnInit {

  activeNav = '1'

  constructor() {
  }

  ngOnInit(): void {
  }

}
