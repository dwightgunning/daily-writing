import { HttpClient, HttpResponse } from '@angular/common/http';
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
  static readonly INVITE_ENDPOINT = `${environment.API_BASE_URL}auth/registration/invite/`;
  constructor(private httpClient: HttpClient) { }

  createInviteRequest(inviteRequest: InviteRequest): Observable<null|ApiError> {
    return this.httpClient.post<any>(
      InviteService.INVITE_ENDPOINT,
      {
        email: inviteRequest.email
      }).pipe(
        map((response: HttpResponse<any>) => null),
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

  checkInviteTokenIsValid(inviteToken: string): Observable<null|ApiError> {
    const url = `${InviteService.INVITE_ENDPOINT}${inviteToken}/`;
    return this.httpClient.get<any>(url).pipe(
        map((response: HttpResponse<any>) => null),
        catchError((error: any) => {
          // 404 is the only error we want to handle specifically; No reason to check the response body
          if (error.status === 404) {
            return of(new ApiError({errors: ['Not found.']}));
          }
          // Log the unexpected backend error and return a generic, reliable message to the user.
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
}
