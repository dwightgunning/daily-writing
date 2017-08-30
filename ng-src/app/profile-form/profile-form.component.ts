import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { Profile } from '../models/profile';


@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss']
})
export class ProfileFormComponent implements OnInit {
  submitted = false;
  error: any;
  model: Profile = new Profile();
  @ViewChild('profileForm') profileForm: any;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService) { }

  ngOnInit() {
    this.profileService.getProfile().subscribe(
      (profile: Profile) => {
        this.model = profile;
      });
  }

  profileFormSubmit() {
    this.submitted = true;
    this.profileService.updateProfile(this.model).subscribe(
      (response) => {
        this.submitted = false;
        if (response instanceof Profile) {
          this.model = response;
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
