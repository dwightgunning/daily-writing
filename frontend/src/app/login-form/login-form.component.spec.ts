import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { of, throwError } from 'rxjs';

import { ApiError } from '../models/api-error';
import { AuthService } from '../services/auth.service';
import { LoginFormComponent } from './login-form.component';
import { UserLoginCredentials } from '../models/user-login-credentials';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let authServiceSpy;

  beforeEach(async(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    TestBed.configureTestingModule({
      declarations: [
        LoginFormComponent
      ],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('validates required fields', () => {});

  xit('renders field errors from auth service', () => {});

  xit('renders non-field errors from auth service', () => {});

  it('emits onSuccess event when auth succeeds', (onExpectationsMet) => {
    const testFormFields = {
      username: 'tester123',
      password: 'fakepassword'
    };
    const testUserLoginCredentials = new UserLoginCredentials(testFormFields);

    component.userLoginFormGroup.controls.username.setValue(testFormFields.username);
    component.userLoginFormGroup.controls.password.setValue(testFormFields.password);
    expect(component.userLoginFormGroup.valid).toBeTruthy();

    spyOn(component.loginSucessful, 'emit');

    const acceptInviteSpy = authServiceSpy.login.and.callFake(
      (data) => {
        expect(acceptInviteSpy).toHaveBeenCalledWith(testUserLoginCredentials);
        onExpectationsMet();
        return of(new UserLoginCredentials({username: testFormFields.username, token: 'abc123'})); // tslint:disable-line deprecation
      });
    component.onSubmit();
    expect(component.loginSucessful.emit).toHaveBeenCalled();
  });

  it('sets errors when auth is unsuccessful', (onExpectationsMet) => {
    const apiError = new ApiError({
      errors: {
        nonFieldErrors: ['Incorrect username/password']
      }
    });
    spyOn(component.loginSucessful, 'emit');

    const acceptInviteSpy = authServiceSpy.login.and.callFake(
      (data) => {
        onExpectationsMet();
        return of(apiError); // tslint:disable-line deprecation
      });
    component.onSubmit();
    expect(component.loginSucessful.emit).not.toHaveBeenCalled();
    expect(component.apiErrors).toEqual(apiError);
  });
});
