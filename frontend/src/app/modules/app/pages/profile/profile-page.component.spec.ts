import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Observable, of } from 'rxjs';

import { UserLoginCredentials } from '../../../../core/models/user-login-credentials';
import { ProfilePageComponent } from './profile-page.component';

@Component({selector: 'app-profile-form', template: ''})
class StubProfileFormComponent {}

const userServiceStub = {
  getUser(): Observable<UserLoginCredentials> {
    return of(new UserLoginCredentials()); // tslint:disable-line deprecation
  }
};

describe('ProfilePageComponent', () => {
  let component: ProfilePageComponent;
  let fixture: ComponentFixture<ProfilePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProfilePageComponent,
        StubProfileFormComponent
      ],
      imports: [
        RouterTestingModule.withRoutes([])
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

  it('should have the title "Profile"', () => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h2').textContent).toContain('Profile');
  });
});
