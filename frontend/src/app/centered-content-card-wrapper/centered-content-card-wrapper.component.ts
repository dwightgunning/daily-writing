import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-centered-content-card-wrapper',
  templateUrl: './centered-content-card-wrapper.component.html',
  styleUrls: ['./centered-content-card-wrapper.component.scss']
})
export class CenteredContentCardWrapperComponent {

  @Input()
  centeredRightContentPane: TemplateRef<any>;

  constructor() { }

}
