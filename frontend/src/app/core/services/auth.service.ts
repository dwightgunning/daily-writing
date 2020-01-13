import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as Sentry from '@sentry/browser';
import { Observable, of,  ReplaySubject } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';

import { ApiError } from '../../core/models/api-error';
import { environment } from '../../../environments/environment';
import { UserLoginCredentials } from '../../core/models/user-login-credentials';
import { UserTokens } from '../../core/models/user-tokens';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  static readonly LOGIN_ENDPOINT = `${environment.API_BASE_URL}auth/token/`;
  static readonly LOGIN_CREDENTIALS_KEY = 'userLoginCredentials';
  static readonly REFRESH_ENDPOINT = `${environment.API_BASE_URL}auth/refresh/`;
  static readonly VERIFY_ENDPOINT = `${environment.API_BASE_URL}auth/refresh/`;

  browserStorage = window.localStorage;
  userTokens$ = new ReplaySubject<UserTokens>(1);

  constructor(private httpClient: HttpClient) {
    let storedCredentialData: string;
    let userTokens: UserTokens;
    try {
      storedCredentialData = this.browserStorage.getItem(AuthService.LOGIN_CREDENTIALS_KEY);
    } catch (error) {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      Sentry.captureException(error);
    }
    if (!storedCredentialData) {
      this.userTokens$.next(null);
      return;
    }

    try {
      userTokens = new UserTokens(JSON.parse(storedCredentialData));
    } catch (error) {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      this.userTokens$.next(null);
      Sentry.captureException(error);
      return;
    }

    if (!userTokens || !(userTokens.username && userTokens.access)) {
      this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
      this.userTokens$.next(null);
      Sentry.captureException('Malformed user credentials in local storage');
      return;
    }

    // Check the stored credentials are still valid
    this.httpClient.get(AuthService.VERIFY_ENDPOINT).pipe(
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
        this.userTokens$.next(userTokens);
        Sentry.configureScope((scope) => {
          scope.setUser({username: userTokens.username});
        });
      } else {
        this.browserStorage.removeItem(AuthService.LOGIN_CREDENTIALS_KEY);
        this.userTokens$.next(null);
      }
    });
  }

  public login(credentials: UserLoginCredentials): Observable<UserTokens|ApiError> {
    return this.httpClient.post(AuthService.LOGIN_ENDPOINT, credentials).pipe(
      map((response) => {
        console.log(response);
        const userTokens = new UserTokens(response);
        try {
          this.browserStorage.setItem(
            AuthService.LOGIN_CREDENTIALS_KEY,
            JSON.stringify(userTokens));
        } catch (error) {
          // If credentials cannot be stored (e.g. Safari incognito mode)
          // we can carry on with the user stored in the service's
          // user credentials Subject.
        }
        this.userTokens$.next(userTokens);
        Sentry.configureScope((scope) => {
          scope.setUser({username: userTokens.username});
        });
        return userTokens;
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
    this.userTokens$.next(null);
  }

  public getUserTokens(): Observable<UserTokens> {
    return this.userTokens$.asObservable().pipe(share());
  }
}
