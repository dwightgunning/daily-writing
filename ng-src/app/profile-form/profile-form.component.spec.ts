import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { MomentModule } from 'angular2-moment';
import { TimezonePickerModule } from 'ng2-timezone-selector';

import { Profile } from '../models/profile';
import { ProfileService } from '../services/profile.service';
import { ProfileFormComponent } from './profile-form.component';

const stubProfileFormComponent = {
  getProfile(): Observable<Profile> {
    return Observable.of(new Profile());
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
        { provide: ProfileService, useValue: stubProfileFormComponent }
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
