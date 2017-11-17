import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { Profile } from '../models/profile';
import { ProfileService } from '../services/profile.service';

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
