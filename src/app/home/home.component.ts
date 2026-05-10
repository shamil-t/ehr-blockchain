import { Component, OnInit } from '@angular/core';
import {NavigationComponent} from "../navigation/navigation.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  imports: [
    NavigationComponent
  ],
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
