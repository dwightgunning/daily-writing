import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {throwError as observableThrowError,  Observable } from 'rxjs';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Profile } from '../models/profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  profileUrl = environment.API_BASE_URL + 'profile/';

  constructor(private http: HttpClient) { }

  public getProfile(): Observable<Profile>  {
    return this.http.get(this.profileUrl)
      .pipe(
        map((response) => response as Profile),
        catchError((error: any) => observableThrowError(error))
      );
  }

  public updateProfile(profile: Profile): Observable<Profile> {
    return this.http.patch(this.profileUrl, profile)
      .pipe(
        map((data: any) => {
          const updatedProfile = new Profile();
          for (const propName of Object.keys(data)) {
            updatedProfile[propName] = data[propName];
          }
          return updatedProfile;
        }),
        catchError((response: HttpErrorResponse, caught: Observable<any>) => {
          // TODO: Raise an appropriate error
          return of(null);  // tslint:disable-line deprecation
        })
      );
  }

}
