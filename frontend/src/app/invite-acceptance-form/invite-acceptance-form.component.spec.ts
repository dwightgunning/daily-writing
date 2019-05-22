import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { of, throwError } from 'rxjs';

import { ApiError } from '../models/api-error';
import { InviteAcceptance } from '../models/invite-acceptance';
import { InviteAcceptanceFormComponent } from './invite-acceptance-form.component';
import { InviteService } from '../services/invite.service';

describe('InviteAcceptanceFormComponent', () => {
  let component: InviteAcceptanceFormComponent;
  let fixture: ComponentFixture<InviteAcceptanceFormComponent>;
  let inviteServiceSpy;

  beforeEach(async(() => {
    inviteServiceSpy = jasmine.createSpyObj('InviteService', ['acceptInvite']);

    TestBed.configureTestingModule({
      declarations: [
        InviteAcceptanceFormComponent
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

    fixture = TestBed.createComponent(InviteAcceptanceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('invokes the InviteService to accept the invite and routes on success', (onExpectationsMet) => {
    const testToken = 'abc123';
    const testFormFields = {
      username: 'tester123',
      password: 'fakepassword'
    };
    const testInviteAcceptance = new InviteAcceptance(testFormFields);

    component.token = testToken;
    component.inviteForm.controls.username.setValue(testFormFields.username);
    component.inviteForm.controls.password.setValue(testFormFields.password);
    expect(component.inviteForm.valid).toBeTruthy();
    spyOn(component.inviteAccepted, 'emit');
    const acceptInviteSpy = inviteServiceSpy.acceptInvite.and.callFake(
      (data) => {
        expect(acceptInviteSpy).toHaveBeenCalledWith(testToken, testInviteAcceptance);
        onExpectationsMet();
        return of(null); // tslint:disable-line deprecation
      });
    component.onSubmit();
    expect(component.inviteAccepted.emit).toHaveBeenCalledWith();
  });

  it('handles form field errors returned from the InviteService', (onExpectationsMet) => {
    const apiError = new ApiError({
      errors: {
        username: ['Username already exists']
      }
    });
    const acceptInviteSpy = inviteServiceSpy.acceptInvite.and.callFake(
      (data) => {
        onExpectationsMet();
        return of(apiError);
      });
    component.onSubmit();
    expect(component.error).toEqual(apiError);
  });

});
