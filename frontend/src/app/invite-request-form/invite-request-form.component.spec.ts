import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { InviteRequest } from '../models/invite-request';
import { InviteRequestFormComponent } from './invite-request-form.component';
import { InviteService } from '../services/invite.service';

describe('InviteRequestFormComponent', () => {
  let component: InviteRequestFormComponent;
  let fixture: ComponentFixture<InviteRequestFormComponent>;
  let inviteServiceSpy;
  let inviteService;

  beforeEach(async(() => {
    inviteServiceSpy = jasmine.createSpyObj('InviteService', ['createInviteRequest', 'checkInviteTokenIsValid', 'acceptInvite']);

    TestBed.configureTestingModule({
      declarations: [ InviteRequestFormComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: InviteService, useValue: inviteServiceSpy }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InviteRequestFormComponent);
    component = fixture.componentInstance;
    inviteService = TestBed.get(InviteService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('invokes the InviteService to create a new request', (onExpectationsMet) => {
    const testData = new InviteRequest({email: 'tester@tester.com'});
    component.model = testData;
    const createInviteRequestSpy = inviteServiceSpy.createInviteRequest.and.callFake(
      (data) => {
        expect(createInviteRequestSpy).toHaveBeenCalledWith(testData);
        onExpectationsMet();
        return of(null); // tslint:disable-line deprecation
      });
    component.inviteRequestFormSubmit();
  });

  it('handles errors from the InviteService when creating new request', (onExpectationsMet) => {
    const testData = new InviteRequest({email: 'tester@tester.com'});
    component.model = testData;
    const createInviteRequestSpy = inviteServiceSpy.createInviteRequest.and.callFake(
      (data) => {
        expect(createInviteRequestSpy).toHaveBeenCalledWith(testData);
        onExpectationsMet();
        return throwError(null);
      });
    component.inviteRequestFormSubmit();
    expect(component.error).toBeTruthy();
  });

  it('confirms submission', fakeAsync(() => {
    let successEl: DebugElement;
    component.confirmSubmission();
    fixture.detectChanges();

    // displays success confirmation
    expect(component.success).toBeTruthy();
    successEl = fixture.debugElement.query(By.css('.form-submit-success'));
    expect(successEl).not.toBeNull();

    // clears success confirmation
    tick(3500);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.success).toBeFalsy();
      successEl = fixture.debugElement.query(By.css('.form-submit-success')).nativeElement;
      expect(successEl).toBe(null);
    });
  }));
});
