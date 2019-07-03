import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { init as sentryInit } from '@sentry/browser';
import { MomentModule } from 'ngx-moment';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthHeaderInterceptor } from './auth-header.interceptor';
import { CenteredContentCardWrapperComponent } from './centered-content-card-wrapper/centered-content-card-wrapper.component';
import { EntryFormComponent } from './entry-form/entry-form.component';
import { EntryListComponent } from './entry-list/entry-list.component';
import { environment } from '../environments/environment';
import { HomePageComponent } from './home-page/home-page.component';
import { InviteAcceptanceFormComponent } from './invite-acceptance-form/invite-acceptance-form.component';
import { InviteAcceptancePageComponent } from './invite-acceptance-page/invite-acceptance-page.component';
import { InviteRequestFormComponent } from './invite-request-form/invite-request-form.component';
import { LoginFormComponent } from './login-form/login-form.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { LogoutComponent } from './logout/logout.component';
import { PageErrorComponent } from './page-error/page-error.component';
import { PageSpinnerComponent } from './page-spinner/page-spinner.component';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { TimezonePickerModule } from './timezone-picker/timezone-picker.module';
import { TopNavBarComponent } from './top-nav-bar/top-nav-bar.component';
import { EntryPageComponent } from './entry-page/entry-page.component';
import { EntryDrawerComponent } from './entry-drawer/entry-drawer.component';

sentryInit({
  dsn: environment.SENTRY_DSN_PUBLIC
});

@NgModule({
  declarations: [
    AppComponent,
    CenteredContentCardWrapperComponent,
    EntryFormComponent,
    EntryListComponent,
    HomePageComponent,
    InviteRequestFormComponent,
    InviteAcceptancePageComponent,
    InviteAcceptanceFormComponent,
    LoginPageComponent,
    LoginFormComponent,
    LogoutComponent,
    PageErrorComponent,
    PageSpinnerComponent,
    ProfileFormComponent,
    ProfilePageComponent,
    ReviewPageComponent,
    SignupPageComponent,
    TopNavBarComponent,
    EntryPageComponent,
    EntryDrawerComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    MomentModule,
    ReactiveFormsModule,
    RouterModule,
    TimezonePickerModule
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
