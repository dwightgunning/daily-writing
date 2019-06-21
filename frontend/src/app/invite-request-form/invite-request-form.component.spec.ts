import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { ApiError } from '../models/api-error';
import { InviteRequest } from '../models/invite-request';
import { InviteRequestFormComponent } from './invite-request-form.component';
import { InviteService } from '../services/invite.service';

describe('InviteRequestFormComponent', () => {
  let component: InviteRequestFormComponent;
  let fixture: ComponentFixture<InviteRequestFormComponent>;
  let inviteServiceSpy;

  beforeEach(async(() => {
    inviteServiceSpy = jasmine.createSpyObj('InviteService', ['createInviteRequest', 'checkInviteTokenIsValid', 'acceptInvite']);

    TestBed.configureTestingModule({
      declarations: [
        InviteRequestFormComponent
      ],
      imports: [
        ReactiveFormsModule
      ],
      providers: [
        { provide: InviteService, useValue: inviteServiceSpy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteRequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('invokes the InviteService to create a new request', (onExpectationsMet) => {
    const testEmail = 'tester@tester.com';
    const testData = new InviteRequest({email: testEmail});

    component.inviteRequestFormGroup.controls.email.setValue(testEmail);
    const createInviteRequestSpy = inviteServiceSpy.createInviteRequest.and.callFake(
      (data) => {
        expect(createInviteRequestSpy).toHaveBeenCalledWith(testData);
        onExpectationsMet();
        return of(null); // tslint:disable-line deprecation
      });
    component.onSubmit();
  });

  it('handles errors from the InviteService when creating new request', (onExpectationsMet) => {
    const testEmail = 'tester@tester.com';
    const testData = new InviteRequest({email: testEmail});

    component.inviteRequestFormGroup.controls.email.setValue(testEmail);
    const createInviteRequestSpy = inviteServiceSpy.createInviteRequest.and.callFake(
      (data) => {
        expect(createInviteRequestSpy).toHaveBeenCalledWith(testData);
        onExpectationsMet();
        return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
      });
    component.onSubmit();
    expect(component.apiErrors).toBeTruthy();
  });
});
