import { Component, Injectable, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { of, Subject, throwError } from 'rxjs';

import { ApiError } from '../models/api-error';
import { InviteAcceptancePageComponent, TokenCheckStates } from './invite-acceptance-page.component';
import { InviteService } from '../services/invite.service';
import { StubRouterLinkDirective } from '../../testing/router-stubs';

@Injectable()
export class ActivatedRouteMock {
    public snapshot = {
      paramMap: convertToParamMap({token: 'abc123'})
    };
}

@Component({
  selector: 'app-centered-content-card-wrapper',
  template: '<ng-container *ngTemplateOutlet="centeredRightContentPane"></ng-container>'
})
class StubCenteredContentCardWrapperComponent {
  @Input() centeredRightContentPane: TemplateRef<any>;
}

@Component({selector: 'app-invite-acceptance-form', template: ''})
export class StubInviteAcceptanceFormComponent {
  @Input() token;
}

@Component({selector: 'app-login-form', template: ''})
export class StubLoginFormComponent {}

@Component({selector: 'app-page-spinner', template: ''})
class StubPageSpinnerComponent { }

@Component({selector: 'app-page-error', template: ''})
class StubPageErrorComponent { }

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
        StubCenteredContentCardWrapperComponent,
        StubLoginFormComponent,
        StubPageErrorComponent,
        StubPageSpinnerComponent,
        StubRouterLinkDirective
      ],
      providers: [
        {provide: ActivatedRoute, useValue: new ActivatedRouteMock()},
        {provide: InviteService, useValue: inviteServiceSpy}
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

    // Subject used in order to defer emitting the entry; intermediate state can be tested
    const deferredCheckResult = new Subject();
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(deferredCheckResult);

    fixture.detectChanges();

    // Test the component passes through the 'in progress' state
    expect(component.tokenCheckState).toEqual(TokenCheckStates.InProgress);
    expect(inviteServiceSpy.checkInviteTokenIsValid).toHaveBeenCalledWith('abc123');

    deferredCheckResult.next(null); // Emit the token check result

    expect(component.tokenCheckState).toEqual(TokenCheckStates.Complete);
    expect(component.inviteAccepted).toBeFalsy();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#inviteAcceptanceForm')).toBeTruthy();
  });

  it('handles invalid tokens by displaying an error message', () => {
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(new ApiError({errors: ['This token appears to be invalid.']})));
    fixture.detectChanges();

    expect(component.tokenCheckState).toEqual(TokenCheckStates.Error);
    expect(component.inviteAccepted).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#appError')).toBeTruthy();
  });

  it('handles exception case with token check completes but is invalid', () => {
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(new ApiError({errors: ['This token appears to be invalid.']})));
    fixture.detectChanges();

    expect(component.tokenCheckState).toEqual(TokenCheckStates.Error);
    expect(component.inviteAccepted).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#appError')).toBeTruthy();
  });

  it('recieves inviteAccepted events updates the template with a confirmation message', () => {
    inviteServiceSpy.checkInviteTokenIsValid.and.returnValue(of(null));
    fixture.detectChanges();
    expect(component.tokenCheckState).toEqual(TokenCheckStates.Complete);

    component.onInviteAccepted();
    fixture.detectChanges();
    expect(component.inviteAccepted).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#inviteAcceptanceConfirmation')).toBeTruthy();
  });
});
