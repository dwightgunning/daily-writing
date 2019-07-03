import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import * as moment from 'moment';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { ApiError } from '../../../core/models/api-error';
import { ApiDataPage } from '../../../core/models/api-data-page';
import { AuthService } from '../../../core/services/auth.service';
import { EntryService } from './entry.service';
import { Entry } from '../models/entry';
import { environment } from '../../../../environments/environment';
import { UserLoginCredentials } from '../../../core/models/user-login-credentials';

describe('EntryService', () => {
  let authServiceSpy;
  let getUserLoginCredentialsSpy;
  let entryService: EntryService;
  let httpTestingController: HttpTestingController;
  const testUserCredentials = new UserLoginCredentials({
    username: 'tester',
    token: 'testtoken123'
  });

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserLoginCredentials']);
    getUserLoginCredentialsSpy = authServiceSpy.getUserLoginCredentials.and.returnValue(of(testUserCredentials));

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {provide: AuthService, useValue: authServiceSpy},
        EntryService
      ]
    });

    // Obtain the service and test controller injected for each test
    entryService = TestBed.get(EntryService as Type<EntryService>);
    httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);
  });

  describe('getOrCreateEntry', () => {

    describe('get entry', () => {
      let expectedEntry;
      let sentryCaptureExceptionSpy;
      let captureExceptionSpy;
      let testTodayUTC;
      let entry;

      beforeEach(() => {
        entry = null;
        expectedEntry = new Entry();
        testTodayUTC = moment().utc().format('YYYY-MM-DD');

        sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
        captureExceptionSpy = jasmine.createSpy('captureException');
        sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
      });

      afterEach(() => {
        httpTestingController.verify();
        expect(getUserLoginCredentialsSpy).toHaveBeenCalledTimes(1);
      });

      it('maps the service response to an Entry for today\'s date (current UTC time) on success (200)', fakeAsync(() => {
        entryService.getOrCreateEntry().subscribe(result => entry = result);
        const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testTodayUTC}/`);
        expect(req.request.method).toEqual('GET');
        expect(req.request.body).toBeNull();
        req.flush(expectedEntry, {status: 200, statusText: 'Ok'});
        tick();

        expect(entry).toEqual(expectedEntry);
      }));

      it('errors with an APIError on an unexpected response code (!200 / 404)', fakeAsync(() => {
        sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

        entryService.getOrCreateEntry().subscribe(result => entry = result);
        const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testTodayUTC}/`);
        req.flush(null, {status: 500, statusText: 'Server Error'});
        tick();

        expect(entry instanceof ApiError).toBeTruthy();
        expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
        expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
      }));

      it('errors with an APIError on unexpected errors', fakeAsync(() => {
        const mockError = new ErrorEvent('Network error', {
          message: 'simulated network error',
        });
        sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

        entryService.getOrCreateEntry().subscribe(result => entry = result);
        const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testTodayUTC}/`);
        req.error(mockError);
        tick();

        expect(entry instanceof ApiError).toBeTruthy();
        expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
        expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
      }));
    });

    describe('create entry', () => {
      let captureExceptionSpy;
      let expectedEntry;
      let sentryCaptureExceptionSpy;
      let testTodayUTC;
      let entry;

      beforeEach(() => {
        entry = null;
        expectedEntry = new Entry();
        testTodayUTC = moment().utc().format('YYYY-MM-DD');

        sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
        captureExceptionSpy = jasmine.createSpy('captureException');
        sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
      });

      afterEach(() => {
        httpTestingController.verify();
        expect(getUserLoginCredentialsSpy).toHaveBeenCalledTimes(1);
      });

      it('maps the service response to an Entry on success (201)', fakeAsync(() => {
        entryService.getOrCreateEntry().subscribe(result => entry = result);

        const getReq = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testTodayUTC}/`);
        getReq.flush(null, {status: 404, statusText: 'Not found'});
        tick();

        const postReq = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}`);

        expect(postReq.request.method).toEqual('POST');
        expect(postReq.request.body).toEqual(new Entry({author: testUserCredentials.username, entryDate: testTodayUTC, words: ''}));
        postReq.flush(expectedEntry, {status: 201, statusText: 'Created'});
        tick();

        expect(entry).toEqual(expectedEntry);
        expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
      }));

      it('errors with an APIError on an unexpected response code (!201)', fakeAsync(() => {
        entryService.getOrCreateEntry().subscribe(result => entry = result);

        const getReq = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testTodayUTC}/`);
        getReq.flush(null, {status: 404, statusText: 'Not found'});
        tick();

        const postReq = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}`);

        expect(postReq.request.method).toEqual('POST');
        expect(postReq.request.body).toEqual(new Entry({author: testUserCredentials.username, entryDate: testTodayUTC, words: ''}));
        postReq.flush(null, {status: 500, statusText: 'Server error'});
        tick();

        expect(entry instanceof ApiError).toBeTruthy();
        expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
        expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
      }));

      it('errors with an APIError on unexpected errors', fakeAsync(() => {
        const mockError = new ErrorEvent('Network error', {
          message: 'simulated network error',
        });

        entryService.getOrCreateEntry().subscribe(result => entry = result);

        const getReq = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testTodayUTC}/`);
        getReq.flush(null, {status: 404, statusText: 'Not found'});
        tick();

        const postReq = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}`);

        expect(postReq.request.method).toEqual('POST');
        expect(postReq.request.body).toEqual(new Entry({author: testUserCredentials.username, entryDate: testTodayUTC, words: ''}));
        postReq.error(mockError);
        tick();

        expect(entry instanceof ApiError).toBeTruthy();
        expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
        expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
      }));
    });
  });

  describe('getEntry', () => {
    let captureExceptionSpy;
    let expectedEntry;
    let sentryCaptureExceptionSpy;
    let testDate;
    let entry;

    beforeEach(() => {
      entry = null;
      expectedEntry = new Entry();
      testDate = moment().utc().format('YYYY-MM-DD');

      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
      captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
    });

    afterEach(() => {
      httpTestingController.verify();
      expect(getUserLoginCredentialsSpy).toHaveBeenCalledTimes(1);
    });

    it('maps the service response to an Entry on success (200)', fakeAsync(() => {
      entryService.getEntry(testDate).subscribe(result => entry = result);
      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
      expect(req.request.method).toEqual('GET');
      expect(req.request.body).toBeNull();
      req.flush(expectedEntry, {status: 200, statusText: 'Ok'});
      tick();

      expect(entry).toEqual(expectedEntry);
    }));

    it('errors with an APIError on an unexpected response code (!200)', fakeAsync(() => {
        entryService.getEntry(testDate).subscribe(result => entry = result);
        const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
        expect(req.request.method).toEqual('GET');
        expect(req.request.body).toBeNull();
        req.flush(null, {status: 404, statusText: 'Not found'});
        tick();

        expect(entry instanceof ApiError).toBeTruthy();
        expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
        expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });

      entryService.getEntry(testDate).subscribe(result => entry = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});
      tick();

      expect(entry instanceof ApiError).toBeTruthy();
      expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('updateEntry', () => {
    let captureExceptionSpy;
    let expectedEntry;
    let sentryCaptureExceptionSpy;
    let testDate;
    let entry;
    let testEntry;

    beforeEach(() => {
      entry = null;
      expectedEntry = new Entry();
      testDate = moment().utc().format('YYYY-MM-DD');
      testEntry = new Entry({
        author: testUserCredentials.username,
        entryDate: testDate,
        words: 'some words in the entry'
      });

      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
      captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
    });

    afterEach(() => {
      httpTestingController.verify();
      expect(getUserLoginCredentialsSpy).toHaveBeenCalledTimes(1);
    });

    it('maps the service response to an Entry object on success (200)', fakeAsync(() => {
      const updatedEntry = new Entry({
        author: testUserCredentials.username,
        entryDate: testDate,
        words: 'some words in the entry',
        createdDate: '2019-06-20T13:29:23.407900+0000',
        entryTimezone: 'Europe/Amsterdam',
        finishTime: '2019-06-20T13:29:23.407459+0000',
        milestoneTime: null,
        milestoneWordCount: 444,
        modifiedDate: '2019-06-20T13:29:23.407948+0000',
        startTime: null,
        wordCount: 0,
      });

      entryService.updateEntry(testEntry).subscribe(result => entry = result);
      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
      expect(req.request.method).toEqual('PATCH');
      expect(req.request.body).toEqual(testEntry);
      req.flush(updatedEntry, {status: 200, statusText: 'Success'});
      tick();

      expect(entry).toEqual(updatedEntry);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('errors with an APIError on an unexpected response code (!200)', fakeAsync(() => {
      entryService.updateEntry(testEntry).subscribe(result => entry = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});
      tick();

      expect(entry instanceof ApiError).toBeTruthy();
      expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on an unexpected response code with payload (!200)', fakeAsync(() => {
      const testError = {author: ['Field required.']};

      entryService.updateEntry(testEntry).subscribe(result => entry = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
      req.flush(testError, {status: 400, statusText: 'Bad Request'});
      tick();

      expect(entry instanceof ApiError).toBeTruthy();
      expect(entry.author).toEqual(entry.author);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });

      entryService.updateEntry(testEntry).subscribe(result => entry = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/${testDate}/`);
      req.error(mockError);
      tick();

      expect(entry instanceof ApiError).toBeTruthy();
      expect(entry.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('listEntries', () => {
    let captureExceptionSpy;
    let sentryCaptureExceptionSpy;
    let testApiDataPage;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException', 'get');
      captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);
    });

    afterEach(() => {
      httpTestingController.verify();
      expect(getUserLoginCredentialsSpy).toHaveBeenCalledTimes(1);
    });

    it('first page - maps the service response to an ApiPageData object on success (200)', fakeAsync(() => {
      const stubApiDataPage = new ApiDataPage({});
      entryService.listEntries().subscribe(result => testApiDataPage = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/`);
      expect(req.request.method).toEqual('GET');
      expect(req.request.body).toBeNull();
      req.flush(stubApiDataPage, {status: 200, statusText: 'Ok'});
      tick();

      expect(testApiDataPage).toEqual(stubApiDataPage);
    }));

    it('other pages - maps the service response to an ApiPageData object on success (200)', fakeAsync(() => {
      const testEntriesUrl = '/entries/more';
      const stubApiDataPage = new ApiDataPage({});
      entryService.listEntries(testEntriesUrl).subscribe(result => testApiDataPage = result);

      const req = httpTestingController.expectOne(testEntriesUrl);
      expect(req.request.method).toEqual('GET');
      expect(req.request.body).toBeNull();
      req.flush(stubApiDataPage, {status: 200, statusText: 'Ok'});
      tick();

      expect(testApiDataPage).toEqual(stubApiDataPage);

    }));

    it('errors with an APIError on an unexpected response code (!200)', fakeAsync(() => {
      entryService.listEntries().subscribe(result => testApiDataPage = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/`);
      req.flush(null, {status: 404, statusText: 'Not found'});
      tick();

      expect(testApiDataPage instanceof ApiError).toBeTruthy();
      expect(testApiDataPage.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });

      entryService.listEntries().subscribe(result => testApiDataPage = result);

      const req = httpTestingController.expectOne(`${EntryService.ENTRY_ENDPOINT}${testUserCredentials.username}/`);
      req.error(mockError);
      tick();

      expect(testApiDataPage instanceof ApiError).toBeTruthy();
      expect(testApiDataPage.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });
});
