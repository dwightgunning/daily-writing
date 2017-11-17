import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Headers, RequestOptions, Response } from '@angular/http';

import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';
import { Profile } from '../models/profile';

@Injectable()
export class ProfileService {
  profileUrl = environment.API_BASE_URL + 'profile/';

  constructor(private http: HttpClient) { }

  public getProfile(): Observable<Profile>  {
    return this.http.get(this.profileUrl)
      .map((response: Response) => response as Profile)
      .catch((error: any) => Observable.throw(error));
  }

  public updateProfile(profile: Profile): Observable<Profile> {
    return this.http.patch(this.profileUrl, profile)
      .map((data: any) => {
        const updatedProfile = new Profile();
        for (const propName of Object.keys(data)) {
          updatedProfile[propName] = data[propName];
        }
        return updatedProfile;
      })
      .catch((response: HttpErrorResponse, caught: Observable<any>) => {
         return Observable.of(null); // TODO: Raise an appropriate error
      });
  }

}
