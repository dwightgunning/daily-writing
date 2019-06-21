import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import * as Sentry from '@sentry/browser';

import { ApiError } from '../models/api-error';
import { InviteAcceptance } from '../models/invite-acceptance';
import { InviteRequest } from '../models/invite-request';
import { InviteService } from './invite.service';

describe('InviteService', () => {
  let httpTestingController: HttpTestingController;
  let inviteService: InviteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        InviteService
      ]
    });

    // Obtain the service and test controller injected for each test
    inviteService = TestBed.get(InviteService as Type<InviteService>);
    httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('createInviteRequest', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
    });

    it('maps the service response and completes with \'null\' on success (201)', fakeAsync(() => {
      const testData = {
        email: 'test@tester.com'
      };
      let inviteRequest;
      inviteService.createInviteRequest(testData).subscribe(result => inviteRequest = result);

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(null, {status: 201, statusText: 'Ok'});
      tick();

      expect(inviteRequest).toBeNull();
    }));

    it('errors with an APIError on an unexpected response code (!201)', fakeAsync(() => {
      const testData = {
        email: 'test@tester.com'
      };
      const errorMessage = 'simulated network error';

      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let inviteRequest;
      inviteService.createInviteRequest(testData).subscribe(result => inviteRequest = result);

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      req.flush(null, {status: 403, statusText: 'Forbidden'});
      tick();

      expect(inviteRequest instanceof ApiError).toBeTruthy();
      expect(inviteRequest.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on an unexpected response code with payload (!201)', fakeAsync(() => {
      const testData = {
        email: 'test@tester.com'
      };
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let inviteRequest;
      inviteService.createInviteRequest(testData).subscribe(result => inviteRequest = result);

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      req.flush({errors: ['Field error']}, {status: 403, statusText: 'Forbidden'});
      tick();

      expect(inviteRequest instanceof ApiError).toBeTruthy();
      expect(inviteRequest.errors).toEqual(['Field error']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const testData = {
        email: 'test@tester.com'
      };
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let inviteRequest;
      inviteService.createInviteRequest(testData).subscribe(result => inviteRequest = result);

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      req.error(mockError);
      tick();

      expect(inviteRequest instanceof ApiError).toBeTruthy();
      expect(inviteRequest.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('checkInviteTokenIsValid', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
    });

    it('200 ok: emits \'null\'', fakeAsync(() => {
      const testToken = 'abc123';

      let tokenCheck;
      inviteService.checkInviteTokenIsValid(testToken).subscribe(result => tokenCheck = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      expect(req.request.method).toEqual('GET');
      req.flush({tokenValid: true}, {status: 200, statusText: 'Ok'});
      tick();

      expect(tokenCheck).toBeNull();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('404 not found: Emits ApiError', fakeAsync(() => {
      const testToken = 'abc123';
      const errorsObj = {
        errors: ['Not found.']
      };

      let tokenCheck;
      inviteService.checkInviteTokenIsValid(testToken).subscribe(result => tokenCheck = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});

      tick();

      expect(tokenCheck instanceof ApiError).toBeTruthy();
      expect(tokenCheck.errors).toEqual(errorsObj.errors);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('HTTP Errors without body: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', fakeAsync(() => {
      const testToken = 'abc123';
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let tokenCheck;
      inviteService.checkInviteTokenIsValid(testToken).subscribe(result => tokenCheck = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 500, statusText: 'Server error'});

      tick();
      expect(tokenCheck instanceof ApiError).toBeTruthy();
      expect(tokenCheck.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('HTTP Errors with unexpected body: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', fakeAsync(() => {
      const testToken = 'abc123';
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
      const errorsObj = ['Other error...'];

      let tokenCheck;
      inviteService.checkInviteTokenIsValid(testToken).subscribe(result => tokenCheck = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(errorsObj, {status: 500, statusText: 'Server error'});

      tick();
      expect(tokenCheck instanceof ApiError).toBeTruthy();
      expect(tokenCheck.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('Other errors: Emits ApiError with \'unexpected error\''
      + ' message and captures error with Sentry', fakeAsync(() => {
      const testToken = 'abc123';
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let tokenCheck;
      inviteService.checkInviteTokenIsValid(testToken).subscribe(result => tokenCheck = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.error(null);

      tick();
      expect(tokenCheck instanceof ApiError).toBeTruthy();
      expect(tokenCheck.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('acceptInvite', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
    });

    it('200 ok: Emits \'null\'', fakeAsync(() => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'user',
        password: 'invalid'
      });

      let acceptedInvite;
      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(result => acceptedInvite = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(testInviteAcceptance);
      req.flush(null, {status: 200, statusText: 'Ok'});
      tick();

      expect(acceptedInvite).toBeNull();
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('422 unprocessable entity: Emits ApiError', fakeAsync(() => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'user',
        password: 'invalid'
      });
      const errorsObj = {
        password: ['Passwords must be 12 characters']
      };
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let acceptedInvite;
      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(result => acceptedInvite = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(errorsObj, {status: 422, statusText: 'Unprocessable Entity'});

      tick();
      expect(acceptedInvite instanceof ApiError).toBeTruthy();
      expect(acceptedInvite).toEqual(new ApiError(errorsObj));
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('404 not found: Emits ApiError', fakeAsync(() => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const errorsObj = {errors: ['Not found.']};

      let acceptedInvite;
      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(result => acceptedInvite = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});

      tick();
      expect(acceptedInvite instanceof ApiError).toBeTruthy();
      expect(acceptedInvite.errors).toEqual(errorsObj.errors);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('HTTP Errors without body: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', fakeAsync(() => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let acceptedInvite;
      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(result => acceptedInvite = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 500, statusText: 'Server error'});

      tick();
      expect(acceptedInvite instanceof ApiError).toBeTruthy();
      expect(acceptedInvite.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('HTTP Errors with unexpected body: Emits ApiError with \'unexpected error\'', fakeAsync(() => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const errorsObj = ['Unexpected error list...'];
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let acceptedInvite;
      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(result => acceptedInvite = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(errorsObj, {status: 500, statusText: 'Server error'});

      tick();
      expect(acceptedInvite instanceof ApiError).toBeTruthy();
      expect(acceptedInvite.errors).toEqual(errorsObj);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('Other errors: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', fakeAsync(() => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let acceptedInvite;
      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(result => acceptedInvite = result);

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.error(null);

      tick();
      expect(acceptedInvite instanceof ApiError).toBeTruthy();
      expect(acceptedInvite.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });
});
