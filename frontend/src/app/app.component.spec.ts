import { Component } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import * as $ from 'jquery';
import * as WebFont from 'webfontloader';

import { AppComponent } from './app.component';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';

@Component({selector: 'app-top-nav-bar', template: ''})
class StubTopNavBarComponent {}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        StubTopNavBarComponent
      ],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have as title "Daily Writing"', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Daily Writing');
  });

  it('initialises Foundation and loads WebFonts', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;

    const foundationSpy = spyOn(app.documentEl, 'foundation');
    const webFontSpy = spyOn(WebFont, 'load');
    fixture.detectChanges();
    expect(foundationSpy).toHaveBeenCalledTimes(1);
    expect(webFontSpy).toHaveBeenCalledTimes(1);
  });

});
