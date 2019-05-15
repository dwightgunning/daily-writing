import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { async, inject, TestBed } from '@angular/core/testing';

import * as Sentry from '@sentry/browser';

import { AuthHeaderInterceptor } from './auth-header.interceptor';

describe('AuthHeaderInterceptor', () => {
  const LOGIN_CREDENTIALS_KEY = 'userLoginCredentials';
  let httpTestClient: HttpClient;
  let mockTestController: HttpTestingController;
  let localStorageGetItemSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [{
         provide: HTTP_INTERCEPTORS,
         useClass: AuthHeaderInterceptor,
         multi: true
      }]
    });

    httpTestClient = TestBed.get(HttpClient);
    mockTestController = TestBed.get(HttpTestingController);
    localStorageGetItemSpy = spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    mockTestController.verify();
  });

  it('should add credentials to Authorization header when stored', () => {
    const testCredentials = {username: 'tester', token: 'abcdef'};

    localStorageGetItemSpy.withArgs(LOGIN_CREDENTIALS_KEY).and.returnValue(JSON.stringify(testCredentials));

    httpTestClient.get('/api').subscribe(response => expect(response).toBeTruthy());

    const request = mockTestController.expectOne(req => {
      expect(req.headers.has('Authorization')).toBeTruthy();
      expect(req.headers.get('Authorization')).toEqual('JWT ' + testCredentials.token);
      return true;
    });
    expect(localStorageGetItemSpy).toHaveBeenCalledWith(LOGIN_CREDENTIALS_KEY);
    request.flush({data: 'test'});
  });

  it('should not add credentials to Authorization header when they\'re not available', () => {
    localStorageGetItemSpy.withArgs(LOGIN_CREDENTIALS_KEY).and.returnValue(null);

    httpTestClient.get('/api').subscribe(response => expect(response).toBeTruthy());

    const request = mockTestController.expectOne(req => !req.headers.has('Authorization'));
    request.flush({data: 'test'});
  });

  it('capture errors encountered when retrieving credentials from storage', () => {
    localStorageGetItemSpy.withArgs(LOGIN_CREDENTIALS_KEY).and.throwError('error getting storage item');
    const captureExceptionSpy = jasmine.createSpy('captureException');
    const sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get').and.returnValue(captureExceptionSpy);

    httpTestClient.get('/api').subscribe(response => expect(response).toBeTruthy());

    const request = mockTestController.expectOne(req => !req.headers.has('Authorization'));
    request.flush({data: 'test'});
    expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
  });
});