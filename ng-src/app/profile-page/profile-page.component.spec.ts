import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { MomentModule } from 'angular2-moment';
import { TimezonePickerModule } from 'ng2-timezone-selector';

import { AuthService } from '../services/auth.service';
import { ProfilePageComponent } from './profile-page.component';
import { ProfileFormComponent } from '../profile-form/profile-form.component';
import { ProfileService } from '../services/profile.service';
import { UserService } from '../services/user.service';

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProfilePageComponent,
        ProfileFormComponent
      ],
      imports: [
        FormsModule,
        HttpClientModule,
        MomentModule,
        TimezonePickerModule
      ],
      providers: [
        { provide: Router, useClass: class { navigate = jasmine.createSpy('navigate'); } },
        AuthService,
        ProfileService,
        UserService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
