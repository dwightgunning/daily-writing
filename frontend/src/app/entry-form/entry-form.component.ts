
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import * as moment from 'moment-timezone';
import {interval as observableInterval, Observable, Subject } from 'rxjs';
import { sample, takeUntil } from 'rxjs/operators';

import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss']
})
export class EntryFormComponent implements OnInit, OnDestroy {
  model: Entry = new Entry();
  ngUnsubscribe = new Subject();
  @ViewChild('entryForm') entryForm: any;

  constructor(
    private entryService: EntryService) { }

  ngOnInit() {
    this.entryService.getOrCreateEntry().subscribe(
      (entry: Entry) => {
        this.model = entry;
        this.createEntryChangeHandler();
      });
  }

  ngOnDestroy() {
      this.removeEntryChangeHandler();
  }

  lastSavedLocalString() {
    if (this.model.finishTime && this.model.entryTimezone) {
      return moment(this.model.finishTime).tz(this.model.entryTimezone).format('HH:mm:ss');
    }
    return '';
  }

  milestoneTimeLocalString(): string {
    if (this.model.milestoneTime && this.model.entryTimezone) {
      return moment(this.model.milestoneTime).tz(this.model.entryTimezone).format('HH:mm:ss');
    }
    return '';
  }

  private createEntryChangeHandler() {
    // Check milestone wordcount on every keystroke
    this.entryForm.valueChanges
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(data => {
          if (!this.model.milestoneTime && this.model.countWords() >= this.model.milestoneWordCount) {
            this.model.milestoneTime = new Date();
          }
        });

    // Update the entry with a 5-sec sampling interval
    this.entryForm.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .pipe(sample(observableInterval(5000)))
      .subscribe(data => {
          this.entryService.updateEntry(this.model).subscribe((newEntry) => {
            for (const property of ['finishTime', 'milestoneTime']) {
              this.model[property] = newEntry[property];
            }
        });
      });
  }

  private removeEntryChangeHandler() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();

    // Send a final update
    this.entryService.updateEntry(this.model).subscribe((newEntry) => {
      for (const property of ['finishTime', 'milestoneTime']) {
        this.model[property] = newEntry[property];
      }
    });
  }
}
