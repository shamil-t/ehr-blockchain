import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div [class]="'card '+background">
      <div class="image">
        <span [class]="'fas fa-' + image" alt="card-logo"></span>
      </div>
      <span class="title" [innerHTML]="title"></span>
      <span class="count" [innerHTML]="count"></span>
    </div>
  `,
  styleUrls: ['./card.component.sass'],
})
export class CardComponent implements OnInit {
  @Input()
  title: any;
  @Input()
  image: any;
  @Input()
  count: any;
  @Input()
  background: any

  constructor() {}

  ngOnInit(): void {}
}
