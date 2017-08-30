import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import 'rxjs/add/operator/switchMap';

import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

@Component({
  selector: 'app-entry-review-page',
  templateUrl: './entry-review-page.component.html',
  styleUrls: ['./entry-review-page.component.scss']
})
export class EntryReviewPageComponent implements OnInit {
  entry: Entry = new Entry();

  constructor(
    private entryService: EntryService,
    private route: ActivatedRoute
    ) { }

  ngOnInit() {
    this.route.params
      .switchMap((params: Params) => this.entryService.getEntry(params['entry_date']))
      .subscribe(entry => this.entry = entry);
  }

}
