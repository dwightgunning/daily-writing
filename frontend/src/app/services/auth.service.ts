import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as Sentry from '@sentry/browser';
import { Observable, of,  ReplaySubject } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';

import { ApiError } from '../models/api-error';
import { environment } from '../../environments/environment';
import { UserLoginCredentials } from '../models/user-login-credentials';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  static readonly LOGIN_ENDPOINT = `${environment.API_BASE_URL}auth/login/`;
  static readonly LOGIN_CREDENTIALS_KEY = 'userLoginCredentials';
  static readonly USER_ENDPOINT = `${environment.API_BASE_URL}auth/user/`;

  browserStorage = window.localStorage;
  userLoginCredentialsSubject = new ReplaySubject<UserLoginCredentials>(1);

  constructor(private httpClient: HttpClient) {
    let storedCredentialData: string;
    let userLoginCredentials: UserLoginCredentials;
    try {
      storedCredentialData = this.browserStorage.getItem(AuthService.LOGIN_CREDENTIALS_KEY);
    } catch (error) {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      Sentry.captureException(error);
    }
    if (!storedCredentialData) {
      this.userLoginCredentialsSubject.next(null);
      return;
    }

    try {
      userLoginCredentials = new UserLoginCredentials(JSON.parse(storedCredentialData));
    } catch (error) {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      this.userLoginCredentialsSubject.next(null);
      Sentry.captureException(error);
      return;
    }

    if (!userLoginCredentials || !(userLoginCredentials.username && userLoginCredentials.token)) {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      this.userLoginCredentialsSubject.next(null);
      Sentry.captureException('Malformed user credentials in local storage');
      return;
    }

    // Check the stored credentials are still valid
    this.httpClient.get(AuthService.USER_ENDPOINT).pipe(
    map((response) => true),
    // map((response) => new UserLoginCredentials(userLoginCredentials)), // as UserLoginCredentials),
    catchError((error) => {
      // Log the unexpected backend error and return a generic, reliable message to the user.
      if (!error.status || error.status >= 500) {
        Sentry.captureException(error);
      }
      return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
    })).subscribe((authenticated: boolean|ApiError) => {
      if (!(authenticated instanceof ApiError)) {
        this.userLoginCredentialsSubject.next(userLoginCredentials);
        Sentry.configureScope((scope) => {
          scope.setUser({username: userLoginCredentials.username});
        });
      } else {
        this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
        this.userLoginCredentialsSubject.next(null);
      }
    });
  }

  public login(credentials: UserLoginCredentials): Observable<UserLoginCredentials|ApiError> {
    return this.httpClient.post(AuthService.LOGIN_ENDPOINT, credentials).pipe(
      map((response) => {
        const userLoginCredentials = new UserLoginCredentials(response);
        try {
          this.browserStorage.setItem(
            AuthService.LOGIN_CREDENTIALS_KEY,
            JSON.stringify(userLoginCredentials));
        } catch (error) {
          // If credentials cannot be stored (e.g. Safari incognito mode)
          // we can carry on with the user stored in the service's
          // user credentials Subject.
        }
        this.userLoginCredentialsSubject.next(userLoginCredentials);
        Sentry.configureScope((scope) => {
          scope.setUser({username: userLoginCredentials.username});
        });
        return userLoginCredentials;
      }),
      catchError((error: any) => {
        if (error.status && error.error) {
            return of(new ApiError(error.error));
        }
        // Log the unexpected backend error and return a generic, reliable message to the user.
        Sentry.captureException(error);
        return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
      })
    );
  }

  public logout(): void {
    try {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
    } catch (error) {
        Sentry.captureException(error);
    }
    this.userLoginCredentialsSubject.next(null);
  }

  public getUserLoginCredentials(): Observable<UserLoginCredentials> {
    return this.userLoginCredentialsSubject.asObservable().pipe(share());
  }
}
