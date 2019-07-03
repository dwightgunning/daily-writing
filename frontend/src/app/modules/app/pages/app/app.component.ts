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
  documentEl: any;

  constructor() {
    this.documentEl = $(document);
  }

  ngOnInit() {
    (this.documentEl as any).foundation();

    WebFont.load({
      google: {
      families: ['Open+Sans']
      }
    });
  }
}
