import { Component, OnInit } from '@angular/core';
import {ViewComponent} from "./view/view.component";
import {AddComponent} from "./add/add.component";

@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.component.html',
  imports: [
    ViewComponent,
    AddComponent
  ],
  styleUrls: ['./doctor.component.sass']
})
export class DoctorComponent implements OnInit {


  constructor() { }

  ngOnInit(): void {
  }

}
