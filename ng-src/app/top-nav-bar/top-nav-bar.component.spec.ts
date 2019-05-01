import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { of, Observable } from 'rxjs';

import { RouterLinkStubDirective } from '../../testing/router-stubs';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { AuthService } from '../services/auth.service';
import { TopNavBarComponent } from './top-nav-bar.component';

const authServiceStub = {
  getUserLoginCredentials(): Observable<UserLoginCredentials> {
    return of(null); // tslint:disable-line deprecation
  }
};

describe('TopNavBarComponent', () => {
  let component: TopNavBarComponent;
  let fixture: ComponentFixture<TopNavBarComponent>;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [
        TopNavBarComponent,
        RouterLinkStubDirective
      ],
      imports: [],
      providers: [
        {provide: AuthService, useValue: authServiceStub }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopNavBarComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display login link when unauthenticated', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();

    // find DebugElements with an attached RouterLinkStubDirective
    const linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    // get the attached link directive instances using the DebugElement injectors
    const links = linkDes
      .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);

    expect(links.length).toBe(2, 'should have 2 links');
    expect(links[0].linkParams).toBe('', '1st link should go to Home');
    expect(links[1].linkParams).toBe('login', '2nd link should go to Login');
  });

  it('should display logout link when authenticated', () => {
    const authService = fixture.debugElement.injector.get(AuthService) as any;
    authService.getUserLoginCredentials =
      (): Observable<UserLoginCredentials> => of(new UserLoginCredentials()); // tslint:disable-line deprecation
    fixture.detectChanges();

    // find DebugElements with an attached RouterLinkStubDirective
    const linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    // get the attached link directive instances using the DebugElement injectors
    const links = linkDes
      .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);

    expect(links.length).toBe(5, 'should have 5 links');
    expect(links[0].linkParams).toBe('', '1st link should go to Home');
    expect(links[1].linkParams).toBe('write', '2st link should go to Write');
    expect(links[2].linkParams).toBe('review', '3rd link should go to Review');
    expect(links[3].linkParams).toBe('profile', '4th link should go to Profile');
    expect(links[4].linkParams).toBe('logout', '5th link should go to Logout');
  });
});
