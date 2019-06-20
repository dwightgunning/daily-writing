import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { catchError, map } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { AuthService } from './auth.service';
import { UserLoginCredentials } from '../models/user-login-credentials';

describe('AuthService', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AuthService
      ]
    });
  });

  describe('constructor', () => {
    let sentryCaptureExceptionSpy;
    let captureExceptionSpy;

    beforeEach(() => {
      // Obtain the injected HttpController
      httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);

      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
      captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('retrieves credentials from local storage and checks they\'re valid with user endpoint', fakeAsync(() => {
      const credentialData = {
        username: 'tester',
        token: 'testtoken123'
      };
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.returnValue(JSON.stringify(credentialData));

      const sentryConfigureScopeSetUserSpy = jasmine.createSpy();
      const sentryConfigureScopeSpy = spyOnProperty(Sentry, 'configureScope').and.callFake(() => (fn) => {
        return fn({setUser: sentryConfigureScopeSetUserSpy});
      });

      // Obtain the service and test controller injected for each test
      authService = TestBed.get(AuthService as Type<AuthService>);
      httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);

      const req = httpTestingController.expectOne(AuthService.USER_ENDPOINT);
      req.flush(new UserLoginCredentials({credentialData}), {status: 200, statusText: 'OK'});
      expect(req.request.body).toBeNull();
      tick();

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(userLoginCredentials).toEqual(new UserLoginCredentials(credentialData));
      expect(sentryConfigureScopeSpy).toHaveBeenCalledTimes(1);
      expect(sentryConfigureScopeSetUserSpy).toHaveBeenCalledWith({username: credentialData.username});
    }));

    it('handles cases where no credentials exist in local storage', fakeAsync(() => {
      const credentialData = {
        username: 'tester',
        token: 'testtoken123'
      };
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.returnValue(null);

      // Obtain the service and test controller injected for each test
      authService = TestBed.get(AuthService as Type<AuthService>);

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(userLoginCredentials).toEqual(null);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('handles errors retrieving credentials from local storage and forces a logout', fakeAsync(() => {
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.throwError('mock local storage error');

      // Obtain the injected service
      authService = TestBed.get(AuthService as Type<AuthService>);

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(userLoginCredentials).toBeNull();
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('handles invalid credentials retrieved from local storage', fakeAsync(() => {
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.returnValue(JSON.stringify({
        username: 'tester'
      }));

      // Obtain the injected service
      authService = TestBed.get(AuthService as Type<AuthService>);

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(userLoginCredentials).toBeNull();
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('handles malformed credentials retrieved from local storage', fakeAsync(() => {
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.returnValue('some data');
      spyOn(JSON, 'parse').and.throwError('JSON parsing error');

      // Obtain the injected service
      authService = TestBed.get(AuthService as Type<AuthService>);

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(userLoginCredentials).toBeNull();
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('handles errors verifying the user credentials with the user service (!200)', fakeAsync(() => {
      const credentialData = {
        username: 'tester',
        token: 'testtoken123'
      };
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.returnValue(JSON.stringify(credentialData));

      // Obtain the injected service
      authService = TestBed.get(AuthService as Type<AuthService>);

      const req = httpTestingController.expectOne(AuthService.USER_ENDPOINT);
      req.flush(null, {status: 400, statusText: 'OK'});
      expect(req.request.body).toBeNull();
      tick();

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(userLoginCredentials).toBeNull();
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('handles errors verifying the user credentials with the user service due to unexpected errors', fakeAsync(() => {
      const credentialData = {
        username: 'tester',
        token: 'testtoken123'
      };
      spyOn(Storage.prototype, 'removeItem');
      spyOn(Storage.prototype, 'getItem').and.returnValue(JSON.stringify(credentialData));

      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });

      // Obtain the service and test controller injected for each test
      authService = TestBed.get(AuthService as Type<AuthService>);

      const req = httpTestingController.expectOne(AuthService.USER_ENDPOINT);
      req.error(mockError);
      expect(req.request.body).toBeNull();
      tick();

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      expect(Storage.prototype.getItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(userLoginCredentials).toBeNull();
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('login', () => {
    let sentryCaptureExceptionSpy;
    let captureExceptionSpy;

    beforeEach(() => {
      localStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      // Obtain the service and test controller injected for each test
      authService = TestBed.get(AuthService as Type<AuthService>);
      httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);

      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
      captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('maps the authenticated user credentials, stores and emits the credentials to subscribers on success (200)', fakeAsync(() => {
      const loginData = new UserLoginCredentials({
        username: 'tester',
        password: 'password'
      });
      const testUserLoginCredentialsData = {
        username: 'tester',
        token: 'testtoken123'
      };
      const testUserLoginCredentials = new UserLoginCredentials(testUserLoginCredentialsData);
      spyOn(Storage.prototype, 'setItem');

      const sentryConfigureScopeSetUserSpy = jasmine.createSpy();
      const sentryConfigureScopeSpy = spyOnProperty(Sentry, 'configureScope').and.callFake(() => (fn) => {
        return fn({setUser: sentryConfigureScopeSetUserSpy});
      });

      let userLoginCredentials;
      authService.login(loginData).subscribe(result => userLoginCredentials = result);

      const req = httpTestingController.expectOne(AuthService.LOGIN_ENDPOINT);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(testUserLoginCredentials, {status: 200, statusText: 'Ok'});
      tick();

      // Login returns the authenticated user
      expect(userLoginCredentials).toEqual(testUserLoginCredentials);

      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      // Login emits the authenticated user via the getUserLoginCredentials observerable
      expect(userLoginCredentials).toEqual(testUserLoginCredentials);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        AuthService.LOGIN_CREDENTIALS_KEY, JSON.stringify(testUserLoginCredentialsData));
      expect(userLoginCredentials).toEqual(testUserLoginCredentials);
      authServiceSubscription.unsubscribe();
      expect(sentryConfigureScopeSpy).toHaveBeenCalledTimes(1);
      expect(sentryConfigureScopeSetUserSpy).toHaveBeenCalledWith(
        {username: testUserLoginCredentialsData.username});
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    xit('handles errors storing the logged in user credentials', fakeAsync(() => {
      const loginData = new UserLoginCredentials({
        username: 'tester',
        password: 'password'
      });
      const testUserLoginCredentialsData = {
        username: 'tester',
        token: 'testtoken123'
      };
      const testUserLoginCredentials = new UserLoginCredentials(testUserLoginCredentialsData);
      spyOn(Storage.prototype, 'setItem').and.throwError('Error storing credentials in local storage');

      let userLoginCredentials;
      authService.login(loginData).subscribe(result => userLoginCredentials = result);

      const req = httpTestingController.expectOne(AuthService.LOGIN_ENDPOINT);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(testUserLoginCredentials, {status: 200, statusText: 'Ok'});
      tick();

      // Login returns the authenticated user
      expect(userLoginCredentials).toEqual(testUserLoginCredentials);

      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      // Login emits the authenticated user via the getUserLoginCredentials observerable
      expect(userLoginCredentials).toEqual(testUserLoginCredentials);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        AuthService.LOGIN_CREDENTIALS_KEY, JSON.stringify(testUserLoginCredentialsData));
      expect(userLoginCredentials).toEqual(testUserLoginCredentials);
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('errors with an APIError on an unexpected response code (!200)', fakeAsync(() => {
      const loginData = new UserLoginCredentials({
        username: 'tester',
        password: 'password'
      });
      const testError = {nonFieldError: ['Invalid username or password.']};
      spyOn(Storage.prototype, 'setItem');

      let userLoginCredentials;
      authService.login(loginData).subscribe(result => userLoginCredentials = result);

      const req = httpTestingController.expectOne(AuthService.LOGIN_ENDPOINT);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(testError, {status: 400, statusText: 'Bad request'});
      tick();

      // Login returns an API Error
      expect(userLoginCredentials.nonFieldError).toEqual(testError.nonFieldError);

      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      // Login emits the authenticated user via the getUserLoginCredentials observerable
      expect(userLoginCredentials).toEqual(null);

      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(0);
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const loginData = new UserLoginCredentials({
        username: 'tester',
        password: 'password'
      });
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });
      spyOn(Storage.prototype, 'setItem');

      let userLoginCredentials;
      authService.login(loginData).subscribe(result => userLoginCredentials = result);

      const req = httpTestingController.expectOne(AuthService.LOGIN_ENDPOINT);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(loginData);
      req.error(mockError);
      tick();

      // Login returns an API Error
      expect(userLoginCredentials.errors).toEqual(['An unexpected error occurred. Please try again.']);

      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      // Login emits the authenticated user via the getUserLoginCredentials observerable
      expect(userLoginCredentials).toEqual(null);

      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(0);
      authServiceSubscription.unsubscribe();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

  });

  describe('logout', () => {
    let sentryCaptureExceptionSpy;
    let captureExceptionSpy;

    beforeEach(() => {
      localStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      // Obtain the service and test controller injected for each test
      authService = TestBed.get(AuthService as Type<AuthService>);
      httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);

      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
      captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('removes the user credentials from local storage', fakeAsync(() => {
      spyOn(Storage.prototype, 'removeItem');
      authService.logout();
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
    }));

    it('logs errors when removing user credentials from local storage', fakeAsync(() => {
      spyOn(Storage.prototype, 'removeItem').and.throwError('mock local storage error');
      authService.logout();

      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(AuthService.LOGIN_CREDENTIALS_KEY);
      expect(captureExceptionSpy).toHaveBeenCalledTimes(1);

      let userLoginCredentials;
      const authServiceSubscription = authService.getUserLoginCredentials().subscribe(
        (result: UserLoginCredentials) => userLoginCredentials = result);
      tick();

      // Login emits the authenticated user via the getUserLoginCredentials observerable
      expect(userLoginCredentials).toEqual(null);
    }));

  });
});
