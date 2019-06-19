import { Component, EventEmitter, Output  } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { UserLoginCredentials } from '../models/user-login-credentials';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
  userLoginFormGroup = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });
  submitted = false;
  apiErrors: any;
  @Output() loginSucessful: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private authService: AuthService) { }

  onSubmit() {
    this.submitted = true;
    this.apiErrors = null;
    const userLoginCredentials = new UserLoginCredentials(this.userLoginFormGroup.value);
    this.authService.login(userLoginCredentials).subscribe(
      (result) => {
        this.submitted = false;
        if (result instanceof UserLoginCredentials) {
          this.loginSucessful.emit();
        } else {
          this.apiErrors = result;
        }
    });
  }
}
