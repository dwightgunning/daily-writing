import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { MomentModule } from 'ngx-moment';
import { init as sentryInit } from '@sentry/browser';

import { AppComponent } from './app.component';
import { AuthGuard } from './guards/auth.guard';
import { AppRoutingModule } from './app-routing.module';
import { AuthHeaderInterceptor } from './auth-header.interceptor';
import { environment } from '../environments/environment';
import { EntryFormComponent } from './entry-form/entry-form.component';
import { EntryListComponent } from './entry-list/entry-list.component';
import { EntryReviewPageComponent } from './entry-review-page/entry-review-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { LogoutComponent } from './logout/logout.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { TimezonePickerModule } from './timezone-picker/timezone-picker.module';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { WritingPageComponent } from './writing-page/writing-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { InviteRequestFormComponent } from './invite-request-form/invite-request-form.component';

sentryInit({
  dsn: environment.SENTRY_DSN_PUBLIC
});

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    HomePageComponent,
    TopNavBarComponent,
    ProfilePageComponent,
    LoginFormComponent,
    WritingPageComponent,
    EntryFormComponent,
    ReviewPageComponent,
    EntryListComponent,
    EntryReviewPageComponent,
    ProfileFormComponent,
    LogoutComponent,
    SignupPageComponent,
    InviteRequestFormComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MomentModule,
    TimezonePickerModule,
    RouterModule
  ],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHeaderInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
