import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, HttpParams, HttpRequest } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import * as Sentry from '@sentry/browser';

import { environment } from '../../environments/environment';
import { InviteRequest } from '../models/invite-request';
import { InviteRequestService } from './invite-request.service';

describe('InviteRequestService', () => {
  let httpTestingController: HttpTestingController;
  let inviteRequestService: InviteRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
    });

    // Inject the service and test controller for each test
    inviteRequestService = TestBed.get(InviteRequestService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(inviteRequestService).toBeTruthy();
  });

  it('maps the service response and completes with \'null\' on a successful (201) "invite request" creation', (onExpectationsMet) => {
    const testData = {
      email: 'test@tester.com'
    };
    const inviteRequest = new InviteRequest(testData);
    inviteRequestService.createInviteRequest(testData).subscribe(
      (data) => {
        expect(data).toBeNull();
        onExpectationsMet();
      });

    const req = httpTestingController.expectOne(InviteRequestService.INVITE_REQUEST_ENDPOINT);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(testData);
    req.flush(null, {status: 201, statusText: 'Ok'});
  });

  it('errors with \'null\' on an unexpected response code (!201) when posting the "invite request"', (onExpectationsMet) => {
    const testData = {
      email: 'test@tester.com'
    };
    const errorMessage = 'simulated network error';
    const mockError = new ErrorEvent('Network error', {
      message: errorMessage,
    });
    const captureExceptionSpy = jasmine.createSpy('captureException');
    const sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get').and.returnValue(captureExceptionSpy);

    inviteRequestService.createInviteRequest(testData).subscribe(
      (data) => fail('should have failed due to the 403 status code'),
      (error: null) => {
        expect(error).toBeNull();
        onExpectationsMet();
      }
    );

    const req = httpTestingController.expectOne(InviteRequestService.INVITE_REQUEST_ENDPOINT);
    req.flush(null, {status: 403, statusText: 'Forbidden'});
    expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
  });

  it('errors with \'null\' on an error when posting the "invite request"', (onExpectationsMet) => {
    const testData = {
      email: 'test@tester.com'
    };
    const errorMessage = 'simulated network error';
    const mockError = new ErrorEvent('Network error', {
      message: errorMessage,
    });
    const captureExceptionSpy = jasmine.createSpy('captureException');
    const sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get').and.returnValue(captureExceptionSpy);

    inviteRequestService.createInviteRequest(testData).subscribe(
      (data) => fail('should have failed with the network error'),
      (error: null) => {
        expect(error).toBeNull();
        onExpectationsMet();
      }
    );

    const req = httpTestingController.expectOne(InviteRequestService.INVITE_REQUEST_ENDPOINT);
    req.error(mockError);
    expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
  });
});
