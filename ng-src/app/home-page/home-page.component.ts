import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';


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
