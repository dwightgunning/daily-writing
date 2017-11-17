import { Component, OnInit } from '@angular/core';

import * as moment from 'moment';

import { ApiDataPage } from '../models/api-data-page';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

@Component({
  selector: 'app-entry-list',
  templateUrl: './entry-list.component.html',
  styleUrls: ['./entry-list.component.scss']
})
export class EntryListComponent implements OnInit {
  entryDataPage: ApiDataPage;
  todayDate;

  constructor(private entryService: EntryService) { }

  ngOnInit() {
     this.todayDate = moment().endOf('day').format('YYYY-MM-DD');

    this.entryService.listEntries().subscribe((response: ApiDataPage) => {
      this.entryDataPage = response;
    });
  }

  onPaginate(pageUrl: string) {
    this.entryService.listEntries(pageUrl).subscribe((response: ApiDataPage) => {
      this.entryDataPage = response;
    });
  }
}
