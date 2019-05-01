import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { of, Observable } from 'rxjs';

import { MomentModule } from 'ngx-moment';

import { Profile } from '../models/profile';
import { ProfileFormComponent } from './profile-form.component';
import { ProfileService } from '../services/profile.service';
import { TimezonePickerModule } from '../timezone-picker/timezone-picker.module';

const stubProfileService = {
  getProfile(): Observable<Profile> {
    return of(new Profile()); // tslint:disable-line deprecation
  }
};

describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProfileFormComponent
      ],
      imports: [
        FormsModule,
        MomentModule,
        RouterTestingModule.withRoutes([]),
        TimezonePickerModule
      ],
      providers: [
        { provide: ProfileService, useValue: stubProfileService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
