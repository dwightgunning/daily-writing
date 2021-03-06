import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { ApiError } from '../../../core/models/api-error';
import { environment } from '../../../../environments/environment';
import { Profile } from '../models/profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  static readonly PROFILE_ENDPOINT = `${environment.API_BASE_URL}profile/`;

  constructor(private httpClient: HttpClient) { }

  public getProfile(): Observable<Profile|ApiError>  {
    return this.httpClient.get(ProfileService.PROFILE_ENDPOINT).pipe(
      map((response) => new Profile(response)),
      catchError((error: any) => {
        // Log the unexpected backend error and return a generic, reliable message to the user.
        Sentry.captureException(error);
        return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
      })
    );
  }

  public updateProfile(profile: Profile): Observable<Profile|ApiError> {
    return this.httpClient.patch(ProfileService.PROFILE_ENDPOINT, profile).pipe(
      map((response) => new Profile(response)),
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
}
