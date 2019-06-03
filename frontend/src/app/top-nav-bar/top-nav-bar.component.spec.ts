import { Component, Type } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TopNavBarComponent } from './top-nav-bar.component';
import { UserLoginCredentials } from '../models/user-login-credentials';

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
        TopNavBarComponent
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

  it('should display authenticated nav-bar when user authenicated', () => {
    fail('Not implemented');
  });

  it('should display unauthenticated nav-bar when no user authenicated', () => {
    fail('Not implemented');
  });


  it('should display logout link when authenticated', () => {
    fixture.detectChanges();

    // find DebugElements with an attached RouterLinkStubDirective
    const linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    // get the attached link directive instances using the DebugElement injectors
    const links = linkDes
      .map(de => de.injector.get<RouterLinkStubDirective>(MyService as Type<RouterLinkStubDirective>);

    expect(links.length).toBe(5, 'should have 5 links');
    expect(links[0].linkParams).toBe('', '1st link should go to Home');
    expect(links[1].linkParams).toBe('/write', '2st link should go to Write');
    expect(links[2].linkParams).toBe('/review', '3rd link should go to Review');
    expect(links[3].linkParams).toBe('/profile', '4th link should go to Profile');
    expect(links[4].linkParams).toBe('/logout', '5th link should go to Logout');
  });
});
