
import {map, catchError} from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as moment from 'moment';
import { of,  Observable } from 'rxjs';
import * as Sentry from '@sentry/browser';

import { ApiDataPage } from '../models/api-data-page';
import { ApiError } from '../models/api-error';
import { Entry } from '../models/entry';
import { environment } from '../../environments/environment';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { AuthService } from './auth.service';


export enum EntryServiceActionState {
  NotStarted,
  InProgress,
  Complete,
  Error
}

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  static readonly ENTRY_ENDPOINT = `${environment.API_BASE_URL}entries/`;
  private user: UserLoginCredentials;

  constructor(
    private authService: AuthService,
    private httpClient: HttpClient) {

    this.authService.getUserLoginCredentials().subscribe(
      (userLoginCredentials) => this.user = userLoginCredentials
    );
  }

  public getOrCreateEntry(): Observable<Entry|ApiError>  {
    const entryDate: string = moment().utc().format('YYYY-MM-DD');

    return this.httpClient.get(`${EntryService.ENTRY_ENDPOINT}${this.user.username}/${entryDate}/`).pipe(
      map((response) => new Entry(response)),
      catchError((error: any) => {
        if (error.status === 404) {
          // TODO: Refactor such that subscription doesn't rely on external scope
          const newEntry = new Entry({ author: this.user.username, entryDate }); // tslint:disable-line rxjs-no-unsafe-scope
          return this.httpClient.post(EntryService.ENTRY_ENDPOINT, newEntry).pipe(
            map((response) => new Entry(response)),
            catchError((newEntryError: any) => {
              // Log the unexpected backend error and return a generic, reliable message to the user.
              Sentry.captureException(newEntryError);
              return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
            })
          );
        } else {
          // Log the unexpected backend error and return a generic, reliable message to the user.
          Sentry.captureException(error);
          return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
        }
      })
    );
  }

  public getEntry(entryDate: string): Observable<Entry|ApiError> {
    return this.httpClient.get(`${EntryService.ENTRY_ENDPOINT}${this.user.username}/${entryDate}/`).pipe(
      map((response) => new Entry(response)),
      catchError((error: any) => {
        // Log the unexpected backend error and return a generic, reliable message to the user.
        Sentry.captureException(error);
        return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
      })
    );
  }

  public updateEntry(entry: Entry): Observable<Entry|ApiError> {
    return this.httpClient.patch(`${EntryService.ENTRY_ENDPOINT}${this.user.username}/${entry.entryDate}/`, entry).pipe(
      map((response) => new Entry(response)),
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

  public listEntries(entriesUrl?: string): Observable<ApiDataPage|ApiError> {
    // TODO: Better encapsulate paging URLs
    if (!entriesUrl) {
      entriesUrl = `${EntryService.ENTRY_ENDPOINT}${this.user.username}/`;
    }

    return this.httpClient.get(entriesUrl).pipe(
      map((entryList) => new ApiDataPage(entryList)),
      catchError((error: any) => {
        // Log the unexpected backend error and return a generic, reliable message to the user.
        Sentry.captureException(error);
        return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
      })
    );
  }
}
