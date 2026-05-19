import {Component, OnInit} from '@angular/core';
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [
    RouterLink
  ],
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}
