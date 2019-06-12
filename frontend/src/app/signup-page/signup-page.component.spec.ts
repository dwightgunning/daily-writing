import { Component, Input, TemplateRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupPageComponent } from './signup-page.component';
import { StubRouterLinkDirective } from '../../testing/router-stubs';

@Component({selector: 'app-centered-content-card-wrapper', template: ''})
class StubCenteredContentCardWrapperComponent {
  @Input() centeredRightContentPane: TemplateRef<any>;
}

@Component({selector: 'app-invite-request-form', template: ''})
class StubRequestInviteComponent {}

describe('SignupPageComponent', () => {
  let component: SignupPageComponent;
  let fixture: ComponentFixture<SignupPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SignupPageComponent,
        StubCenteredContentCardWrapperComponent,
        StubRequestInviteComponent,
        StubRouterLinkDirective
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
