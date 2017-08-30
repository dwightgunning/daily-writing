import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import {MomentModule} from 'angular2-moment/moment.module';
import { TimezonePickerModule } from 'ng2-timezone-selector';
import * as Raven from 'raven-js';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthHeaderInterceptor } from './auth-header.interceptor';
import { AuthService } from './services/auth.service';
import { EntryService } from './services/entry.service';
import { environment } from '../environments/environment';
import { LoginPageComponent } from './login-page/login-page.component';
import { ProfileService } from './services/profile.service';
import { HomePageComponent } from './home-page/home-page.component';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { UserService } from './services/user.service';
import { WritingPageComponent } from './writing-page/writing-page.component';
import { EntryFormComponent } from './entry-form/entry-form.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { EntryListComponent } from './entry-list/entry-list.component';
import { EntryReviewPageComponent } from './entry-review-page/entry-review-page.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';

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
    ProfileFormComponent
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
