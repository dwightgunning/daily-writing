import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { of, Observable } from 'rxjs';
import { MomentModule } from 'ngx-moment';

import { ApiError } from '../../../../core/models/api-error';
import { Profile } from '../../models/profile';
import { ProfileFormComponent } from './profile-form.component';
import { ProfileService } from '../../services/profile.service';
import { TimezonePickerModule } from '../../../../core/components/timezone-picker/timezone-picker.module';

describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;
  let profileServiceSpy;

  beforeEach(async(() => {
    profileServiceSpy = jasmine.createSpyObj('ProfileService', ['getProfile', 'updateProfile']);

    TestBed.configureTestingModule({
      declarations: [
        ProfileFormComponent
      ],
      imports: [
        ReactiveFormsModule,
        MomentModule,
        RouterTestingModule.withRoutes([]),
        TimezonePickerModule
      ],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
  });

  it('should retrieve the user profile on init and pre-populate the form', () => {
    const testProfile = new Profile({
      email: 'tester@test.com',
      firstName: 'first',
      lastName: 'last',
      timezone: 'etc/UTC',
      targetMilestoneWordCount: '750'
    });

    // TODO setup a subject to defer emitting the result and testing spinners
    profileServiceSpy.getProfile.and.returnValue(of(testProfile));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#email').value).toBe(testProfile.email);
    expect(fixture.nativeElement.querySelector('#firstName').value).toBe(testProfile.firstName);
    expect(fixture.nativeElement.querySelector('#lastName').value).toBe(testProfile.lastName);
    // TODO: Test selected timezone
    expect(fixture.nativeElement.querySelector('#targetMilestoneWordCount').value).toBe(testProfile.targetMilestoneWordCount);
  });

  it('handles errors retrieving the profile on init', () => {
    // TODO setup a subject to defer emitting the result and testing spinners
    profileServiceSpy.getProfile.and.returnValue(of(new ApiError({})));
    fixture.detectChanges();
  });

  it('updates the user profile on form submission', (onExpectationsMet) => {
    profileServiceSpy.getProfile.and.returnValue(of(new Profile()));
    fixture.detectChanges();
    // TODO setup a subject to defer emitting the result and testing spinners
    profileServiceSpy.updateProfile.and.callFake((data) => {
      onExpectationsMet();
      return of(new Profile());
    });
    component.onSubmit();
  });

  it('handles errors updating the profile on submit', (onExpectationsMet) => {
    profileServiceSpy.getProfile.and.returnValue(of(new Profile()));
    fixture.detectChanges();
    // TODO setup a subject to defer emitting the result and testing spinners
    profileServiceSpy.updateProfile.and.callFake((data) => {
      onExpectationsMet();
      return of(new ApiError({}));
    });
    component.onSubmit();
  });

  xit('validates form fields', () => {});

  xit('renders field errors from profile service', () => {});

  xit('renders non-field errors from profile service', () => {});
});
