import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { init as sentryInit } from '@sentry/browser';
import { MomentModule } from 'ngx-moment';

import { AppComponent } from './pages/app/app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AuthHeaderInterceptor } from '../../core/interceptors/auth-header.interceptor';
import { CenteredCardComponent } from '../../core/components/centered-card/centered-card.component';
import { EntryFormComponent } from './components/entry-form/entry-form.component';
import { EntryListComponent } from './components/entry-list/entry-list.component';
import { environment } from '../../../environments/environment';
import { HomePageComponent } from './pages/home/home-page.component';
import { InviteAcceptanceFormComponent } from '../../core/components/invite-acceptance-form/invite-acceptance-form.component';
import { InviteAcceptancePageComponent } from './pages/invite-acceptance/invite-acceptance-page.component';
import { InviteRequestFormComponent } from '../../core/components/invite-request-form/invite-request-form.component';
import { LoginFormComponent } from '../../core/components/login-form/login-form.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { LogoutComponent } from '../../core/authentication/logout/logout.component';
import { PageErrorComponent } from '../../core/components/page-error/page-error.component';
import { PageSpinnerComponent } from '../../core/components/page-spinner/page-spinner.component';
import { ProfileFormComponent } from './components/profile-form/profile-form.component';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { ReviewPageComponent } from './pages/review/review-page.component';
import { SignupPageComponent } from './pages/signup/signup-page.component';
import { TimezonePickerModule } from '../../core/components/timezone-picker/timezone-picker.module';
import { TopNavBarComponent } from '../../core/components/top-nav-bar/top-nav-bar.component';
import { EntryPageComponent } from './pages/entry/entry-page.component';
import { EntryDrawerComponent } from './components/entry-drawer/entry-drawer.component';

sentryInit({
  dsn: environment.SENTRY_DSN_PUBLIC
});

@NgModule({
  declarations: [
    AppComponent,
    CenteredCardComponent,
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
