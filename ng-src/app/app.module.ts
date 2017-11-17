import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import {MomentModule} from 'angular2-moment/moment.module';
import { TimezonePickerModule } from 'ng2-timezone-selector';
import * as Raven from 'raven-js';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthHeaderInterceptor } from './auth-header.interceptor';
import { EntryFormComponent } from './entry-form/entry-form.component';
import { EntryListComponent } from './entry-list/entry-list.component';
import { EntryReviewPageComponent } from './entry-review-page/entry-review-page.component';
import { AuthGuard } from './guards/auth.guard';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { LogoutComponent } from './logout/logout.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { AuthService } from './services/auth.service';
import { EntryService } from './services/entry.service';
import { ProfileService } from './services/profile.service';
import { UserService } from './services/user.service';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { WritingPageComponent } from './writing-page/writing-page.component';

Raven
  .config(environment.SENTRY_DSN_PUBLIC)
  .install();

export class RavenErrorHandler implements ErrorHandler {
  handleError(err: any): void {
    Raven.captureException(err);
  }
}

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
    LogoutComponent
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
    AuthService,
    EntryService,
    ProfileService,
    UserService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHeaderInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
