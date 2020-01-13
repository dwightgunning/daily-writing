import { Component, OnDestroy, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { UserTokens } from '../../models/user-tokens';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-top-nav-bar',
  templateUrl: './top-nav-bar.component.html',
  styleUrls: ['./top-nav-bar.component.scss']
})
export class TopNavBarComponent implements OnInit {
  private titleBarResponsiveToggle;
  private topBarToggler;
  userTokens: Observable<UserTokens>;

  constructor(
    private authService: AuthService) { }

  ngOnInit() {
    this.userTokens = this.authService.getUserTokens();
  }
}
