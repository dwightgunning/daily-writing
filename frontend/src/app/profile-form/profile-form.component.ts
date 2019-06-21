import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ApiError } from '../models/api-error';
import { Profile } from '../models/profile';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-profile-form',
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfileFormComponent implements OnInit {
  submitted = false;
  apiErrors: any; // TODO: Type properly
  model: Profile = new Profile();
  profileFormGroup = new FormGroup({
    email: new FormControl('', [Validators.required]),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    timezone: new FormControl('', [Validators.required]),
    targetMilestoneWordCount: new FormControl('', [Validators.required]),
  });

  constructor(
    private profileService: ProfileService) { }

  ngOnInit() {
    this.profileService.getProfile().subscribe(
      (result: Profile|ApiError) => {
        if (result instanceof ApiError) {
          this.apiErrors = result;
          // TODO: Map errors into the form fields
        } else {
          this.profileFormGroup.patchValue(result);
        }
      });
  }

  onSubmit() {
    this.submitted = true;
    this.apiErrors = null;
    const profile = new Profile(this.profileFormGroup.value);
    this.profileService.updateProfile(profile).subscribe(
      (result: Profile|ApiError) => {
        this.submitted = false;
        if (result instanceof ApiError) {
          this.apiErrors = result;
          // TODO: Map errors into the form fields
        } else {
          this.profileFormGroup.patchValue(result);
          this.profileFormGroup.reset(this.profileFormGroup.value);
          // TODO: Emit a success event
        }
      }
    );
  }
}
