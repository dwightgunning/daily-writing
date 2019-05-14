import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EntryReviewPageComponent } from './entry-review-page/entry-review-page.component';
import { AuthGuard } from './guards/auth.guard';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { LogoutComponent } from './logout/logout.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { ReviewPageComponent } from './review-page/review-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { WritingPageComponent } from './writing-page/writing-page.component';

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
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'write',
    canActivate: [AuthGuard],
    component: WritingPageComponent,
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
        component: EntryReviewPageComponent
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
