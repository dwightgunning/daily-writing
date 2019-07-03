import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { HomePageComponent } from './pages/home/home-page.component';
import { InviteAcceptancePageComponent } from './pages/invite-acceptance/invite-acceptance-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { LogoutComponent } from '../../core/authentication/logout/logout.component';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { ReviewPageComponent } from './pages/review/review-page.component';
import { SignupPageComponent } from './pages/signup/signup-page.component';
import { EntryPageComponent } from './pages/entry/entry-page.component';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'signup',
    component: SignupPageComponent,
  },
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'invite/:token',
    component: InviteAcceptancePageComponent,
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'write',
    canActivate: [AuthGuard],
    component: EntryPageComponent,
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    component: ProfilePageComponent,
  },
  {
    path: 'review',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ReviewPageComponent
      },
      {
        path: 'entry/:entryDate',
        component: EntryPageComponent,
        data: { mode: 'review' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
