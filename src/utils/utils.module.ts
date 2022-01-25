import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Progress_cardComponent } from './progress_card/progress_card.component';



@NgModule({
  declarations: [
    Progress_cardComponent
  ],
  imports: [
    CommonModule
  ],
  exports:[
    Progress_cardComponent
  ]
})
export class UtilsModule { }
