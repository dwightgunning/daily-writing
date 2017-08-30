import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { MomentModule } from 'angular2-moment';
import { TimezonePickerModule } from 'ng2-timezone-selector';

import { AuthService } from '../services/auth.service';
import { ProfileFormComponent } from './profile-form.component';
import { ProfileService } from '../services/profile.service';

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
        HttpClientModule,
        MomentModule,
        TimezonePickerModule
      ],
      providers: [
        { provide: Router, useClass: class { navigate = jasmine.createSpy('navigate'); } },
        AuthService,
        ProfileService
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
