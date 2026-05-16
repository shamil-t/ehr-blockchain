import {Component, Input, OnInit} from '@angular/core';
import {RouterLink} from "@angular/router";
import {NgClass} from "@angular/common";

@Component({
  selector: 'doctor-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [
    RouterLink,
    NgClass
  ],
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Input()
  isCollapsed!: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
