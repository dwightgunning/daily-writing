import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, HttpParams, HttpRequest } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';

import * as Sentry from '@sentry/browser';

import { ApiError } from '../models/api-error';
import { environment } from '../../environments/environment';
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
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get');
    });

    it('maps the service response and completes with \'null\' on success (201)', (onExpectationsMet) => {
      // inject([InviteService, HttpTestingController], (inviteService: InviteService, httpTestingController: HttpTestingController) => {
      const testData = {
        email: 'test@tester.com'
      };
      const inviteRequest = new InviteRequest(testData);
      inviteService.createInviteRequest(testData).subscribe(
        (data) => {
          expect(data).toBeNull();
          onExpectationsMet();
        });

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(null, {status: 201, statusText: 'Ok'});
    });
      // })();
    // });

    it('errors with an APIError on an unexpected response code (!201)', (onExpectationsMet) => {
      const testData = {
        email: 'test@tester.com'
      };
      const errorMessage = 'simulated network error';

      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.createInviteRequest(testData).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      req.flush(null, {status: 403, statusText: 'Forbidden'});
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    });

    it('errors with an APIError on unexpected errors', (onExpectationsMet) => {
      const testData = {
        email: 'test@tester.com'
      };
      const errorObj = {
        message: 'simulated network error',
      };
      const mockError = new ErrorEvent('Network error', errorObj);
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.createInviteRequest(testData).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(InviteService.INVITE_ENDPOINT);
      req.error(mockError);
    });
  });

  describe('checkInviteTokenIsValid', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get');
    });

    it('200 ok: emits \'null\'', (onExpectationsMet) => {
      const testToken = 'abc123';

      inviteService.checkInviteTokenIsValid(testToken).subscribe(
        (result) => {
          expect(result).toBeNull();
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
          onExpectationsMet();
        });

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      expect(req.request.method).toEqual('GET');
      req.flush({tokenValid: true}, {status: 200, statusText: 'Ok'});
    });

    it('404 not found: Emits ApiError', (onExpectationsMet) => {
      const testToken = 'abc123';
      const errorsObj = {
        errors: ['Not found.']
      };

      inviteService.checkInviteTokenIsValid(testToken).subscribe(
        (result: any) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(errorsObj.errors);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
          onExpectationsMet();
        });

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});
    });

    it('HTTP Errors without body: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', (onExpectationsMet) => {
      const testToken = 'abc123';
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.checkInviteTokenIsValid(testToken).subscribe(
        (result: any) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 500, statusText: 'Server error'});
    });

    it('HTTP Errors with unexpected body: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', (onExpectationsMet) => {
      const testToken = 'abc123';
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
      const errorsObj = ['Other error...'];

      inviteService.checkInviteTokenIsValid(testToken).subscribe(
        (result: any) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(errorsObj, {status: 500, statusText: 'Server error'});
    });

    it('Other errors: Emits ApiError with \'unexpected error\''
      + ' message and captures error with Sentry', (onExpectationsMet) => {
      const testToken = 'abc123';
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.checkInviteTokenIsValid(testToken).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.error(null);
    });
  });

  describe('acceptInvite', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get');
    });

    it('200 ok: Emits \'null\'', (onExpectationsMet) => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'user',
        password: 'invalid'
      });

      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(
        (result) => {
          expect(result).toBeNull();
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(testInviteAcceptance);
      req.flush(null, {status: 200, statusText: 'Ok'});
    });

    it('422 unprocessable entity: Emits ApiError', (onExpectationsMet) => {
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

      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result).toEqual(new ApiError(errorsObj));
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(errorsObj, {status: 422, statusText: 'Unprocessable Entity'});
    });

    it('404 not found: Emits ApiError', (onExpectationsMet) => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const errorsObj = {errors: ['Not found.']};

      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(errorsObj.errors);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});
    });

    it('HTTP Errors without body: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', (onExpectationsMet) => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(null, {status: 500, statusText: 'Server error'});
    });

    it('HTTP Errors with unexpected body: Emits ApiError with \'unexpected error\'', (onExpectationsMet) => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const errorsObj = ['Unexpected error list...'];
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(errorsObj);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.flush(errorsObj, {status: 500, statusText: 'Server error'});
    });

    it('Other errors: Emits ApiError with \'unexpected error\''
        + ' message and captures error with Sentry', (onExpectationsMet) => {
      const testToken = 'abc123';
      const testInviteAcceptance = new InviteAcceptance({
        username: 'tester123',
        password: 'fakepassword'
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      inviteService.acceptInvite(testToken, testInviteAcceptance).subscribe(
        (result) => {
          expect(result instanceof ApiError).toBeTruthy();
          expect(result.errors).toEqual(['An unexpected error occurred. Please try again.']);
          expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
          onExpectationsMet();
        }
      );

      const req = httpTestingController.expectOne(`${InviteService.INVITE_ENDPOINT}${testToken}/`);
      req.error(null);
    });

  });
});
