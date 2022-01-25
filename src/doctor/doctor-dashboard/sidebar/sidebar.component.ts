import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'doctor-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Input()
  isCollapsed!: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
