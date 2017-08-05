import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserLoginCredentials } from '../models/user-login-credentials';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
  error: any;
  model = new UserLoginCredentials();
  submitted = false;

  constructor(
    private router: Router,
    private AuthService: AuthService) { }

  ngOnInit() { }

  loginFormSubmit() {
    this.submitted = true;
    this.AuthService.login(this.model).subscribe(
      (response) => {
        this.submitted = false;
        if (response instanceof UserLoginCredentials) {
          this.router.navigate(['/profile']);
        } else {
          this.error = response;
        }
      },
      (error) => {
        this.submitted = false;
        this.error = error;
      });
  }
}
