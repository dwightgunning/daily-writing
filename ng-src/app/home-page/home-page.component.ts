import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  apiResponse;
  title = 'Daily Writing';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.getApi();
  }

  private getApi() {
    this.http.get(
        environment.API_BASE_URL,
        {headers: new HttpHeaders({'Authorization': 'SkipInterceptor'})})
      .toPromise().then((res) => {
        this.apiResponse = JSON.stringify(res);
      });
  }

}
