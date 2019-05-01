
import {switchMap} from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';



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
    this.route.params.pipe(
      switchMap((params: Params) => this.entryService.getEntry(params.entryDate)))
      .subscribe(entry => this.entry = entry);
  }

}
