import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-progress_card',
  templateUrl: './progress_card.component.html',
  styleUrls: ['./progress_card.component.sass'],
  imports: []
})
export class Progress_cardComponent implements OnInit {
  @Input()
  show!: boolean;
  @Input()
  msg_text!: string;
  @Input()
  warn: boolean = false;
  @Input()
  success: boolean = false

  @Input()
  retry_text: string = 'Retry';

  @Output()
  retry: EventEmitter<any> = new EventEmitter<any>();
  @Output()
  close: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
  }

  ngOnInit() {

    // console.log(this.show, this.msg_text);
  }

  onRetry() {
    this.retry.emit();
  }

  onClose() {
    this.close.emit()
  }
}
