import { Component, Type } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { of, Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TopNavBarComponent } from './top-nav-bar.component';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { StubRouterLinkDirective } from '../../testing/router-stubs';

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
        StubRouterLinkDirective
      ],
      providers: [
        {provide: AuthService, useValue: authServiceStub }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopNavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display logout link when authenticated', () => {
    component.userLoginCredentials = of(new UserLoginCredentials());
    fixture.detectChanges();

    // find DebugElements with an attached StubRouterLinkDirective
    const linkDes = fixture.debugElement
      .queryAll(By.directive(StubRouterLinkDirective));

    // get the attached link directive instances using the DebugElement injectors
    const links = linkDes.map(de => de.injector.get<StubRouterLinkDirective>(StubRouterLinkDirective as Type<StubRouterLinkDirective>));

    expect(links.length).toBe(6, 'should have 6 links');
    expect(links[0].linkParams).toBe('/write', '1st link should go to Home');
    expect(links[1].linkParams).toBe('/write', '2nd link should go to Home');
    expect(links[2].linkParams).toBe('/write', '3rd link should go to Write');
    expect(links[3].linkParams).toBe('/review', '4th link should go to Review');
    expect(links[4].linkParams).toBe('/profile', '5th link should go to Profile');
    expect(links[5].linkParams).toBe('/logout', '6th link should go to Logout');
  });
});
