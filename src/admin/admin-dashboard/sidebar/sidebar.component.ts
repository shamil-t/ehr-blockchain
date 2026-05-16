import {Component, Input, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  imports: [
    NgClass,
    RouterLink
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
