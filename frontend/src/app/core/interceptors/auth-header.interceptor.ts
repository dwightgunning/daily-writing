import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';

import { empty, Observable } from 'rxjs';
import * as Sentry from '@sentry/browser';

import { UserLoginCredentials } from '../../core/models/user-login-credentials';

@Injectable()
export class AuthHeaderInterceptor implements HttpInterceptor {
  private LOGIN_CREDENTIALS_KEY = 'userLoginCredentials';

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let loadedCredentials: UserLoginCredentials;
    try {
      loadedCredentials = JSON.parse(localStorage.getItem(this.LOGIN_CREDENTIALS_KEY));
    } catch (err) {
      Sentry.captureException(err);
    }

    if (loadedCredentials && loadedCredentials.token) {
      // Pass a cloned request instead of the original request to the next handle
      req = req.clone({
        headers: req.headers.set('Authorization', 'JWT ' + loadedCredentials.token)
      });
    }

    return next.handle(req);
  }
}
