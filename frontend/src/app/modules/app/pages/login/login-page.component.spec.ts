import { Component, Input, TemplateRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { LoginPageComponent } from './login-page.component';
import { StubRouterLinkDirective } from '../../../../../testing/router-stubs';

@Component({
  selector: 'app-centered-card',
  template: '<ng-container *ngTemplateOutlet="centeredRightContentPane"></ng-container>'
})
class StubCenteredCardComponent {
  @Input() centeredRightContentPane: TemplateRef<any>;
}

@Component({selector: 'app-login-form', template: ''})
class StubLoginFormComponent {}

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;
  let routerSpy;

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [
        LoginPageComponent,
        StubCenteredCardComponent,
        StubLoginFormComponent,
        StubRouterLinkDirective
      ],
      imports: [],
      providers: [
        [ { provide: Router, useValue: routerSpy}],
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the login form and a link to signup', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#loginForm')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a.signup-cta')).toBeTruthy();
  });

  it('navigates to the writing page on successful login', () => {
    const routerNavigateSpy = routerSpy.navigate.and.returnValue();
    component.onLoginSuccessful();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/write']);
  });
});
