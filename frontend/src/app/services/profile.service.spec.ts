import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import * as Sentry from '@sentry/browser';

import { ApiError } from '../models/api-error';
import { Profile } from '../models/profile';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let httpTestingController: HttpTestingController;
  let profileService: ProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ProfileService
      ]
    });

    // Obtain the service and test controller injected for each test
    profileService = TestBed.get(ProfileService as Type<ProfileService>);
    httpTestingController = TestBed.get(HttpTestingController as Type<HttpTestingController>);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getProfile', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
    });

    it('maps the service response to a Profile object on success (200)', fakeAsync(() => {
      const testData = {
        email: 'tester@test.com',
        firstName: 'first',
        lastName: 'last',
        timezone: 'etc/UTC',
        targetMilestoneWordCount: 500
      };
      let profile;
      profileService.getProfile().subscribe(result => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      expect(req.request.method).toEqual('GET');
      expect(req.request.body).toBeNull();
      req.flush(new Profile(testData), {status: 200, statusText: 'Ok'});
      tick();

      expect(profile).toEqual(new Profile(testData));
    }));

    it('errors with an APIError on an unexpected response code (!200)', fakeAsync(() => {
      let profile;
      profileService.getProfile().subscribe(result => profile = result);

      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.flush(null, {status: 404, statusText: 'Not found'});
      tick();

      expect(profile instanceof ApiError).toBeTruthy();
      expect(profile.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on an unexpected response code with payload (!200)', fakeAsync(() => {
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let profile;
      profileService.getProfile().subscribe(result => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.flush({errors: ['Not found']}, {status: 404, statusText: 'Not found'});
      tick();

      expect(profile instanceof ApiError).toBeTruthy();
      expect(profile.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let profile;
      profileService.getProfile().subscribe(result => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.error(mockError);
      tick();

      expect(profile instanceof ApiError).toBeTruthy();
      expect(profile.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });

  describe('updateProfile', () => {
    let sentryCaptureExceptionSpy;

    beforeEach(() => {
      sentryCaptureExceptionSpy = spyOnProperty(Sentry, 'captureException');
    });

    it('maps the service response to a Profile object on success (201)', fakeAsync(() => {
      const testProfile = new Profile({
        firstName: 'first',
        lastName: 'last',
      });

      const patchedProfile = new Profile({
        email: 'tester@test.com',
        firstName: 'first',
        lastName: 'last',
        timezone: 'etc/UTC',
        targetMilestoneWordCount: 500
      });

      let profile;
      profileService.updateProfile(testProfile).subscribe((result) => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.flush(patchedProfile, {status: 201, statusText: 'Ok'});
      expect(req.request.method).toEqual('PATCH');
      expect(req.request.body).toEqual(testProfile);
      tick();

      expect(profile).toEqual(patchedProfile);
    }));

    it('errors with an APIError on an unexpected response code (!201)', fakeAsync(() => {
      const testProfile = new Profile({
        firstName: 'first',
        lastName: 'last',
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let profile;
      profileService.updateProfile(testProfile).subscribe((result) => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.flush(null, {status: 500, statusText: 'Server error'});
      expect(req.request.body).toEqual(testProfile);
      tick();

      expect(profile instanceof ApiError).toBeTruthy();
      expect(profile.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));

    it('errors with an APIError on an unexpected response code with payload (!201)', fakeAsync(() => {
      const testProfile = new Profile({
        targetMilestoneWordCount: 'one'
      });
      const testError = {targetMilestoneWordCount: ['A valid integer is required.']};
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let profile;
      profileService.updateProfile(testProfile).subscribe((result) => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.flush(testError, {status: 400, statusText: 'Invalid Request'});
      expect(req.request.body).toEqual(testProfile);
      tick();

      expect(profile instanceof ApiError).toBeTruthy();
      expect(profile.targetMilestoneWordCount).toEqual(testError.targetMilestoneWordCount);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(0);
    }));

    it('errors with an APIError on unexpected errors', fakeAsync(() => {
      const testProfile = new Profile({
        targetMilestoneWordCount: 'one'
      });
      const mockError = new ErrorEvent('Network error', {
        message: 'simulated network error',
      });
      const captureExceptionSpy = jasmine.createSpy('captureException');
      sentryCaptureExceptionSpy.and.returnValue(captureExceptionSpy);

      let profile;
      profileService.updateProfile(testProfile).subscribe((result) => profile = result);

      const req = httpTestingController.expectOne(ProfileService.PROFILE_ENDPOINT);
      req.error(mockError);
      tick();

      expect(profile instanceof ApiError).toBeTruthy();
      expect(profile.errors).toEqual(['An unexpected error occurred. Please try again.']);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledTimes(1);
    }));
  });
});
