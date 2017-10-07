import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { UserLoginCredentials } from '../models/user-login-credentials';
import { Headers, RequestOptions } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { User } from '../models/user';

@Injectable()
export class UserService {

  constructor(private http: HttpClient) { }

  public getUser(): Observable<User>  {
    return this.http.get(environment.API_BASE_URL + 'user/')
      .map((response: Response) => response as User)
      .catch((error: any) => Observable.throw(error));
  }

}
