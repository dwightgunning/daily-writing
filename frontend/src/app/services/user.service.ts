
import {throwError as observableThrowError,  Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';


import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { UserLoginCredentials } from '../models/user-login-credentials';

@Injectable()
export class UserService {

  constructor(private http: HttpClient) { }

  public getUser(): Observable<User>  {
    return this.http.get(environment.API_BASE_URL + 'auth/user/')
      .pipe(
        map((response) => response as User),
        catchError((error: any) => observableThrowError(error))
      );
  }

}
