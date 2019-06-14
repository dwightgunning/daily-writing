import { HttpClient } from '@angular/common/http';
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
  private LOGIN_CREDENTIALS_KEY = 'userLoginCredentials';
  userLoginCredentialsSubject = new ReplaySubject<UserLoginCredentials>(1);

  constructor(private httpClient: HttpClient) {
    let storedUserLoginCredentials: UserLoginCredentials;
    try {
      storedUserLoginCredentials = JSON.parse(
        localStorage.getItem(this.LOGIN_CREDENTIALS_KEY)) as UserLoginCredentials;
    } catch ( err ) {
      // TODO: Shouldn't occur in practice. Investigate error reporting options.
    } finally {
      if (storedUserLoginCredentials && storedUserLoginCredentials.token) {
        // Check the stored credentials are still valid
        this.httpClient.get(environment.API_BASE_URL + 'auth/user/')
          .subscribe(
            (authenticatedToken: UserLoginCredentials) => {
              this.userLoginCredentialsSubject.next(storedUserLoginCredentials);
            },
            (err: any) => {
              localStorage.removeItem(this.LOGIN_CREDENTIALS_KEY);
              // TODO: log error, display user a message
              this.userLoginCredentialsSubject.next(null);
            }
          );
      } else {
        localStorage.removeItem(this.LOGIN_CREDENTIALS_KEY);
        this.userLoginCredentialsSubject.next(null);
      }
    }
  }

  public login(credentials: UserLoginCredentials): Observable<UserLoginCredentials|ApiError> {
    return this.httpClient.post(
        environment.API_BASE_URL + 'auth/login/',
        {
          username: credentials.username,
          password: credentials.password,

        }).pipe(
      map((authenticatedToken: UserLoginCredentials) => {
        if (authenticatedToken.token) {
          const userLoginCredentials = new UserLoginCredentials(
            credentials.username,
            undefined,
            authenticatedToken.token);
          try {
            localStorage.setItem(
              this.LOGIN_CREDENTIALS_KEY,
              JSON.stringify(userLoginCredentials));
          } catch (e) {
            // If credentials cannot be stored (e.g. Safari incognito mode)
            // we can carry on with the user stored in the service's
            // user credentials Subject.
          }
          this.userLoginCredentialsSubject.next(userLoginCredentials);
          return userLoginCredentials;
        } else {
          this.userLoginCredentialsSubject.next(null);
          return new ApiError({errors: ['Invalid username/password']});
        }
      }),
      catchError((error: any) => {
        if (error.status && error.error) {
            return of(new ApiError(error.error));
        } else if (error.status === 404) {
          return of(new ApiError({errors: ['Not found.']}));
        }
        // Log the unexpected backend error and return a generic, reliable message to the user.
        Sentry.captureException(error);
        return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
      })
    );
  }

  public logout(): void {
    try {
      localStorage.removeItem(this.LOGIN_CREDENTIALS_KEY);
    } catch ( err ) { }
    this.userLoginCredentialsSubject.next(null);
  }

  public getUserLoginCredentials(): Observable<UserLoginCredentials> {
    return this.userLoginCredentialsSubject.asObservable().pipe(share());
  }
}
