import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <header class="navbar sticky-top mt-4 flex-md-nowrap p-0 shadow">
      <a
        class="navbar-brand col-md-2 col-lg-2 px-3 text-white fs-bold"
        href="#"
        >EHR Hospital</a
      >
      <button
        class="navbar-toggler d-md-none"
        type="button"
        (click)="collapseSideNav()"
      >
        <span [ngClass]="!collapse ? 'fas fa-bars' : 'fas fa-times'"></span>
      </button>
    </header>
  `,
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @Output()
  onCollapse = new EventEmitter();
  constructor() {}

  collapse:boolean = false;

  ngOnInit(): void {}

  collapseSideNav() {
    this.collapse = ! this.collapse
    this.onCollapse.emit();
  }
}
