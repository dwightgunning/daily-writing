
import { of,  Observable } from 'rxjs';

import {map, catchError} from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as moment from 'moment';

import { ApiDataPage } from '../models/api-data-page';
import { ApiError } from '../models/api-error';
import { Entry } from '../models/entry';
import { environment } from '../../environments/environment';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  private entryBaseUrl = environment.API_BASE_URL + 'entries/';
  private user: UserLoginCredentials;

  constructor(
    private http: HttpClient,
    private authService: AuthService) {

    this.authService.getUserLoginCredentials().subscribe(
      (userLoginCredentials) => this.user = userLoginCredentials
    );
  }

  public getOrCreateEntry(): Observable<Entry|ApiError>  {
    const entryDate: string =  moment().utc().format('YYYY-MM-DD');

    return this.http.get(this.entryBaseUrl + this.user.username + '/' + entryDate + '/').pipe(
      map((data: object) => {
        const entry = new Entry();
        for (const propName of Object.keys(data)) {
          entry[propName] = data[propName];
        }

        return entry;
      }),
      catchError((getEntryErrorResponse: HttpErrorResponse, getEntryCaught: Observable<any>) => {
          if (getEntryErrorResponse.status === 404) {
            return this.http.post(this.entryBaseUrl,
            {
              author: this.user.username,
              entryDate,
              words: '' // TODO: Fix backend error when not provided; shouldn't be mandatory
            }).pipe(map((data: object) => {
              const entry = new Entry();
              for (const propName of Object.keys(data)) { // TODO: Flip so that the local Class properties are keyed
                entry[propName] = data[propName];
                // TODO: Unit Test that date fields are parsed assuming current timezone is UTC.
              }
              return entry;
            }),
            catchError((createEntryErrorResponse: HttpErrorResponse, createEntryCaught: Observable<any>) => {
              return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
            }), );
          } else {
            return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
          }
        }), );
  }

  public getEntry(entryDate: string): Observable<Entry> {
    const entryUrl = this.entryBaseUrl + this.user.username + '/' + entryDate + '/';

    return this.http.get(entryUrl).pipe(
      map((data: any) => {
        const entry = new Entry();
        for (const propName of Object.keys(data)) {
          entry[propName] = data[propName];
        }
        return entry;
      }));
  }

  public updateEntry(entry: Entry): Observable<Entry> {
    const entryUrl = this.entryBaseUrl + this.user.username + '/' + entry.entryDate + '/';

    return this.http.patch(entryUrl, entry).pipe(
      map((data: any) => {
        const updatedEntry = new Entry();
        for (const propName of Object.keys(data)) {
          updatedEntry[propName] = data[propName];
        }
        return updatedEntry;
      }),
      catchError((response: HttpErrorResponse, caught: Observable<any>) => {
          // TODO: Raise an appropriate error
          return of(null);  // tslint:disable-line deprecation
      }), );
  }

  public listEntries(entriesUrl?: string): Observable<ApiDataPage> {
    if (!entriesUrl) {
      entriesUrl = this.entryBaseUrl + this.user.username + '/';
    }

    return this.http.get(entriesUrl).pipe(map(
      entryList => new ApiDataPage(entryList)
    ));
  }
}
