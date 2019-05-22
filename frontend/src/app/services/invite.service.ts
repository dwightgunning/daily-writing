import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { environment } from '../../environments/environment';
import { ApiError } from '../models/api-error';
import { InviteAcceptance } from '../models/invite-acceptance';
import { InviteRequest } from '../models/invite-request';

@Injectable({
  providedIn: 'root'
})
export class InviteService {
  static readonly INVITE_ENDPOINT = environment.API_BASE_URL + 'auth/registration/invite/';
  constructor(private httpClient: HttpClient) { }

  createInviteRequest(inviteRequest: InviteRequest): Observable<null> {
    return this.httpClient.post<null>(
      InviteService.INVITE_ENDPOINT,
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

  checkInviteTokenIsValid(inviteToken: string): Observable<null|ApiError> {
    const url = `${InviteService.INVITE_ENDPOINT}${inviteToken}/`;
    return this.httpClient.get<any>(url).pipe(
        map((response: HttpResponse<any>) => null),
        catchError((error: any) => {
          if (error.error) {
            return of(new ApiError(error.error));
          } else if (error.status === 404) {
            return of(new ApiError({errors: ['Not found.']}));
          }
          Sentry.captureException(error);
          return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
        })
      );
  }

  acceptInvite(inviteToken: string, inviteAcceptance: InviteAcceptance): Observable<null|ApiError> {
    const url = `${InviteService.INVITE_ENDPOINT}${inviteToken}/`;
    return this.httpClient.post<any>(url, inviteAcceptance).pipe(
        map((response: HttpResponse<any>) => null),
        catchError((error: any) => {
          if (error.error) {
            return of(new ApiError(error.error));
          } else if (error.status === 404) {
            return of(new ApiError({errors: ['Not found.']}));
          }
          Sentry.captureException(error);
          return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
        })
      );

  }
}
