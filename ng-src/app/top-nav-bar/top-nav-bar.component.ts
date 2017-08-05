import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { AuthService } from '../services/auth.service';
import { UserLoginCredentials } from '../models/user-login-credentials';

@Component({
  selector: 'app-top-nav-bar',
  templateUrl: './top-nav-bar.component.html',
  styleUrls: ['./top-nav-bar.component.scss']
})
export class TopNavBarComponent implements OnInit {
  userLoginCredentials: Observable<UserLoginCredentials>;

  constructor(
    private router: Router,
    private AuthService: AuthService) {
      this.userLoginCredentials = AuthService.getUserLoginCredentials();
  }

  ngOnInit() {
  }

  public logoutUser(): void {
    this.AuthService.logout();
    this.router.navigate(['/']);
  }

}
