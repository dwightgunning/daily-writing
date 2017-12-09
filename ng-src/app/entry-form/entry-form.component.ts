import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import * as moment from 'moment-timezone';

import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/sample';
import 'rxjs/add/operator/skip';
import {Observable} from 'rxjs/Observable';

import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss']
})
export class EntryFormComponent implements OnInit {
  model: Entry = new Entry();
  entryDate = new Date();
  @ViewChild('entryForm') entryForm: any;

  constructor(
    private entryService: EntryService) { }

  ngOnInit() {
    this.entryService.getOrCreateEntry().subscribe(
      (entry: Entry) => {
        this.model = entry;
        this.setupEntryChangeHandler();
      });
  }

  lastSavedLocalString() {
    if (this.model.finish_time && this.model.entry_timezone) {
      return moment(this.model.finish_time).tz(this.model.entry_timezone).format('HH:mm:ss');
    }
    return '';
  }

  milestoneTimeLocalString(): string {
    if (this.model.milestone_time && this.model.entry_timezone) {
      return moment(this.model.milestone_time).tz(this.model.entry_timezone).format('HH:mm:ss');
    }
    return '';
  }

  private setupEntryChangeHandler() {
    this.entryForm.valueChanges
        .distinctUntilChanged()
        .skip(1) // Skip the change resulting from model assignment
        .subscribe(data => {
          if (!this.model.milestone_time && this.model.wordCount() >= this.model.milestone_word_count) {
            this.model.milestone_time = new Date();
          }
        });

    this.entryForm.valueChanges
        .sample(Observable.interval(5000))
        .distinctUntilChanged()
        .skip(1) // Skip the change resulting from model assignment
        .subscribe(data => {
            this.entryService.updateEntry(this.model).subscribe((newEntry) => {
              for (const property of ['finish_time', 'milestone_time']) {
                this.model[property] = newEntry[property];
              }
          });
        });
  }

}
