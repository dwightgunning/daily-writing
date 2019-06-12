import { Component, Input, TemplateRef } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from '../services/auth.service';
import { LoginPageComponent } from './login-page.component';
import { StubRouterLinkDirective } from '../../testing/router-stubs';

@Component({selector: 'app-centered-content-card-wrapper', template: ''})
class StubCenteredContentCardWrapperComponent {
  @Input() centeredRightContentPane: TemplateRef<any>;
}

@Component({selector: 'app-login-form', template: ''})
class StubLoginFormComponent {}

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        LoginPageComponent,
        StubCenteredContentCardWrapperComponent,
        StubLoginFormComponent,
        StubRouterLinkDirective
      ],
      imports: [],
      providers: []
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
