import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { environment } from '../../environments/environment';
import { InviteRequest } from '../models/invite-request';

@Injectable({
  providedIn: 'root'
})
export class InviteRequestService {
  static readonly INVITE_REQUEST_ENDPOINT = environment.API_BASE_URL + 'auth/requestInvite/';
  constructor(private httpClient: HttpClient) { }

  createInviteRequest(inviteRequest: InviteRequest): Observable<null> {
    return this.httpClient.post<null>(
      InviteRequestService.INVITE_REQUEST_ENDPOINT,
      {
        email: inviteRequest.email
      }).pipe(
        map(response => null),
        catchError(error => {
          Sentry.captureException(error);
          return throwError(null);
        })
      );
  }
}
