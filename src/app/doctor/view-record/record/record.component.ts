import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-record',
  templateUrl: './record.component.html',
  styleUrls: ['./record.component.sass'],
  imports: [
    NgOptimizedImage
  ]
})
export class RecordComponent implements OnInit {
  @Input() PatientRecord: any;
  Medical: any;

  @Output() close = new EventEmitter<any>();
  constructor() {}

  ngOnInit(): void {
    this.Medical = this.PatientRecord.data;
  }

  onClose(){
    this.close.emit()
  }
}
