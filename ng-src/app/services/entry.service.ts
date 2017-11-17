import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as moment from 'moment';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { ApiDataPage } from '../models/api-data-page';
import { Entry } from '../models/entry';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { AuthService } from './auth.service';

@Injectable()
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

  public getOrCreateEntry(): Observable<Entry>  {
    const entry_date: string =  moment().utc().format('YYYY-MM-DD');

    return this.http.get(this.entryBaseUrl + this.user.username + '/' + entry_date + '/')
      .map((data: object) => {
        const entry = new Entry();
        for (const propName of Object.keys(data)) {
          entry[propName] = data[propName];
        }

        return entry;
      })
      .catch((getEntryErrorResponse: HttpErrorResponse, getEntryCaught: Observable<any>) => {
          if (getEntryErrorResponse.status === 404) {
            return this.http.post(this.entryBaseUrl,
            {
              'author': this.user.username,
              'entry_date': entry_date,
              'words': '' // TODO: Fix backend error when not provided; shouldn't be mandatory
            }).map((data: object) => {
              const entry = new Entry();
              for (const propName of Object.keys(data)) { // TODO: Flip so that the local Class properties are keyed
                entry[propName] = data[propName];
                // TODO: Unit Test that date fields are parsed assuming current timezone is UTC.
              }
              return entry;
            })
            .catch((createEntryErrorResponse: HttpErrorResponse, createEntryCaught: Observable<any>) => {
              return Observable.of(null); // TODO: Raise an appropriate error
            });
          } else {
            return Observable.of(null); // TODO: Raise an appropriate error
          }
        });
  }

  public getEntry(entry_date: string): Observable<Entry> {
    const entryUrl = this.entryBaseUrl + this.user.username + '/' + entry_date + '/';

    return this.http.get(this.entryBaseUrl + this.user.username + '/' + entry_date + '/')
      .map((data: any) => {
        const entry = new Entry();
        for (const propName of Object.keys(data)) {
          entry[propName] = data[propName];
        }
        return entry;
      });
  }

  public updateEntry(entry: Entry): Observable<Entry> {
    const entryUrl = this.entryBaseUrl + this.user.username + '/' + entry.entry_date + '/';

    return this.http.patch(entryUrl, entry)
      .map((data: any) => {
        const updatedEntry = new Entry();
        for (const propName of Object.keys(data)) {
          updatedEntry[propName] = data[propName];
        }
        return updatedEntry;
      })
      .catch((response: HttpErrorResponse, caught: Observable<any>) => {
         return Observable.of(null); // TODO: Raise an appropriate error
      });
  }

  public listEntries(entriesUrl?: string): Observable<ApiDataPage> {
    if (!entriesUrl) {
      entriesUrl = this.entryBaseUrl + this.user.username + '/';
    }

    return this.http.get(entriesUrl).map(
      entryList => new ApiDataPage(entryList)
    );
  }
}
