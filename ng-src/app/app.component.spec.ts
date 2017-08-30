import { TestBed, async } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';

import { TimezonePickerModule } from 'ng2-timezone-selector';
import { MomentModule } from 'angular2-moment';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './guards/auth.guard';
import { environment } from '../environments/environment';
import { EntryFormComponent } from './entry-form/entry-form.component';
import { EntryListComponent } from './entry-list/entry-list.component';
import { EntryReviewPageComponent } from './entry-review-page/entry-review-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { WritingPageComponent } from './writing-page/writing-page.component';
import { AuthService } from './services/auth.service';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        EntryFormComponent,
        EntryListComponent,
        EntryReviewPageComponent,
        LoginPageComponent,
        HomePageComponent,
        TopNavBarComponent,
        ProfileFormComponent,
        ProfilePageComponent,
        LoginFormComponent,
        ReviewPageComponent,
        WritingPageComponent
      ],
      imports: [
        AppRoutingModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        MomentModule,
        TimezonePickerModule
      ],
      providers: [
        AuthGuard,
        {provide: APP_BASE_HREF, useValue: '/'},
        AuthService
      ],
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Daily Writing');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Daily Writing');
  }));
});
