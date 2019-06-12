import { Directive, Input } from '@angular/core';

/* tslint:disable */
@Directive({
  selector: '[routerLink]',
  host: {
    '(click)': 'onClick()'
  }
})
export class StubRouterLinkDirective {
  @Input('routerLink') linkParams: string;
  navigatedTo: any = null;

  onClick() {
    this.navigatedTo = this.linkParams;
  }
}
