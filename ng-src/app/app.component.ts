import { Component, OnInit } from '@angular/core';
import * as WebFont from 'webfontloader';

declare let $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Daily Writing';

  constructor() { }

  ngOnInit() {
    $(document).foundation();

    WebFont.load({
      google: {
      families: ['Open+Sans']
      }
    });
  }
}
