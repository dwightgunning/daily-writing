import { Component, Input, TemplateRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SignupPageComponent } from './signup-page.component';
import { StubRouterLinkDirective } from '../../testing/router-stubs';

@Component({
  selector: 'app-centered-content-card-wrapper',
  template: '<ng-container *ngTemplateOutlet="centeredRightContentPane"></ng-container>'
})
class StubCenteredContentCardWrapperComponent {
  @Input() centeredRightContentPane: TemplateRef<any>;
}

@Component({selector: 'app-invite-request-form', template: ''})
class StubRequestInviteComponent {}

describe('SignupPageComponent', () => {
  let component: SignupPageComponent;
  let fixture: ComponentFixture<SignupPageComponent>;
  let routerSpy;

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [
        SignupPageComponent,
        StubCenteredContentCardWrapperComponent,
        StubRequestInviteComponent,
        StubRouterLinkDirective
      ],
      providers: [
        [ { provide: Router, useValue: routerSpy}],
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // component init
  });

  it('renders the invite request form and a link to login', () => {
    fixture.detectChanges(); // change of input to CenteredContentCardWrapperComponent
    expect(fixture.nativeElement.querySelector('#inviteRequestForm')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a.login-cta')).toBeTruthy();
  });

  it('renders a confirmation after successful invite request submission', () => {
    fixture.detectChanges(); // change of input to CenteredContentCardWrapperComponent
    const routerNavigateSpy = routerSpy.navigate.and.returnValue();
    component.onInviteRequested();
    fixture.detectChanges(); // change of input to CenteredContentCardWrapperComponent
    expect(fixture.nativeElement.querySelector('.h2').textContent).toBe('Request submitted');
  });

});
