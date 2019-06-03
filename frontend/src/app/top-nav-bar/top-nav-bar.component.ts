import { Component, OnDestroy, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-top-nav-bar',
  templateUrl: './top-nav-bar.component.html',
  styleUrls: ['./top-nav-bar.component.scss']
})
export class TopNavBarComponent implements OnInit {
  private titleBarResponsiveToggle;
  private topBarToggler;
  userLoginCredentials: Observable<UserLoginCredentials>;

  constructor(
    private authService: AuthService) { }

  ngOnInit() {
    this.userLoginCredentials = this.authService.getUserLoginCredentials();
  }
}
