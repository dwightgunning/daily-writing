import { Component, Injectable, EventEmitter, Input, Output } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { of, Subject, throwError } from 'rxjs';

import { ApiError } from '../models/api-error';
import { InviteAcceptancePageComponent, TokenCheckStates } from './invite-acceptance-page.component';
import { InviteService } from '../services/invite.service';
import { RouterLinkStubDirective } from '../../testing/router-stubs';

@Injectable()
export class ActivatedRouteMock {
    public snapshot = {
      paramMap: convertToParamMap({token: 'abc123'})
    };
}

@Component({selector: 'app-invite-acceptance-form', template: ''})
export class StubInviteAcceptanceFormComponent {
  @Input() token;
}

@Component({selector: 'app-login-form', template: ''})
export class StubLoginFormComponent {}


describe('InviteAcceptancePageComponent', () => {
  let component: InviteAcceptancePageComponent;
  let fixture: ComponentFixture<InviteAcceptancePageComponent>;
  let inviteServiceSpy;

  beforeEach(async(() => {
    inviteServiceSpy = jasmine.createSpyObj('InviteService', ['checkInviteTokenIsValid']);

    TestBed.configureTestingModule({
      declarations: [
        StubInviteAcceptanceFormComponent,
        InviteAcceptancePageComponent,
        RouterLinkStubDirective,
        StubLoginFormComponent
      ],
      providers: [
        {provide: ActivatedRoute, useValue: new ActivatedRouteMock() },
        { provide: InviteService, useValue: inviteServiceSpy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteAcceptancePageComponent);
    component = fixture.componentInstance;
  });

  it('obtains the token from the activated route', () => {
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(null));
    fixture.detectChanges();
    expect(component.token).toEqual('abc123');
  });

  it('checks token validity on intialisation', () => {
    expect(component.inviteAccepted).toBeFalsy();
    expect(component.tokenCheckState).toEqual(TokenCheckStates.NotStarted);

    // Subject used in order to defer emitting the result so the intermediate state can tested
    const deferredCheckResult = new Subject();
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(deferredCheckResult);

    fixture.detectChanges();

    // Test the component passes through the 'in progress' state
    expect(component.tokenCheckState).toEqual(TokenCheckStates.InProgress);
    expect(inviteServiceSpy.checkInviteTokenIsValid).toHaveBeenCalledWith('abc123');

    deferredCheckResult.next(null); // Emit the result

    expect(component.tokenCheckState).toEqual(TokenCheckStates.Complete);
    expect(component.inviteAccepted).toBeFalsy();
  });

  it('handles invalid tokens by displaying an error message', () => {
    const serviceErrorMessage = 'This token appears to be invalid.';
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(new ApiError({errors: [serviceErrorMessage]})));
    fixture.detectChanges();
    expect(component.tokenCheckState).toEqual(TokenCheckStates.Error);
    expect(component.inviteAccepted).toBeFalsy();
    expect(fixture.debugElement.nativeElement.querySelector('p').textContent).toContain(serviceErrorMessage);
  });

  it('handles exception case with token check completes but is invalid', () => {
    const serviceErrorMessage = 'An error occurred. Please try again later.';
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(new ApiError({errors: [serviceErrorMessage]})));
    fixture.detectChanges();
    expect(fixture.debugElement.nativeElement.querySelector('p').textContent).toContain(serviceErrorMessage);
    expect(component.inviteAccepted).toBeFalsy();
  });

  it('recieves inviteAccepted events', () => {
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(null));
    component.onInviteAccepted();
    expect(component.inviteAccepted).toBeTruthy();
  });
});
