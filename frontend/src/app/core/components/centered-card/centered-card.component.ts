import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-centered-card',
  templateUrl: './centered-card.component.html',
  styleUrls: ['./centered-card.component.scss']
})
export class CenteredCardComponent {

  @Input()
  centeredRightContentPane: TemplateRef<any>;

  constructor() { }

}
