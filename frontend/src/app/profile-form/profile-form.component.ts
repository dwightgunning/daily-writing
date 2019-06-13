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
  submitting = false;
  success = false;
  error: any;  model: Profile = new Profile();
  @ViewChild('profileForm', { static: false }) profileForm: any;


  constructor(
    private profileService: ProfileService) { }

  ngOnInit() {
    this.profileService.getProfile().subscribe(
      (profile: Profile) => {
        this.model = profile;
      });
  }

  profileFormSubmit() {
    this.submitting = true;
    this.profileService.updateProfile(this.model).subscribe(
      (response) => {
        this.submitting = false;
        if (response instanceof Profile) {
          this.model = response;
          this.success = true;
          ((component) => {
            setTimeout(() => {
              component.success = false;
              component.profileForm.form.markAsPristine();
            }, 3000);
          })(this);
        } else {
          this.error = response;
        }
      },
      (error) => {
        this.submitting = false;
        this.error = error;
      });

  }

}
