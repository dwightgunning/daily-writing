import { APP_BASE_HREF } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MomentModule } from 'angular2-moment';
import { TimezonePickerModule } from 'ng2-timezone-selector';

import { AppComponent } from '../app.component';
import { AppRoutingModule } from '../app-routing.module';
import { AuthService } from '../services/auth.service';
import { EntryFormComponent } from '../entry-form/entry-form.component';
import { EntryListComponent } from '../entry-list/entry-list.component';
import { EntryService } from '../services/entry.service';
import { EntryReviewPageComponent } from '../entry-review-page/entry-review-page.component';
import { LoginFormComponent } from '../login-form/login-form.component';
import { LoginPageComponent } from '../login-page/login-page.component';
import { HomePageComponent } from '../home-page/home-page.component';
import { TopNavBarComponent } from '../top-nav-bar/top-nav-bar.component';
import { ProfileFormComponent } from '../profile-form/profile-form.component';
import { ProfilePageComponent } from '../profile-page/profile-page.component';
import { ReviewPageComponent } from '../review-page/review-page.component';
import { WritingPageComponent } from '../writing-page/writing-page.component';

describe('WritingPageComponent', () => {
  let component: WritingPageComponent;
  let fixture: ComponentFixture<WritingPageComponent>;

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
        FormsModule,
        HttpClientModule,
        MomentModule,
        TimezonePickerModule
      ],
      providers: [
        AuthService,
        {provide: APP_BASE_HREF, useValue: '/'},
        EntryService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WritingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
