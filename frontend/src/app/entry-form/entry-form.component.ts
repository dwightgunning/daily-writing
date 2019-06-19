import { AfterViewInit, Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ViewChild } from '@angular/core';

import * as moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min';
import {interval as observableInterval, Observable, Subject, Subscription } from 'rxjs';
import { sample, takeUntil } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { ApiError } from '../models/api-error';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

export enum EntryServiceActionState {
  NotStarted,
  InProgress,
  Complete,
  Error
}

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss']
})
export class EntryFormComponent implements OnInit, AfterViewInit, OnDestroy {
  EntryServiceActionState: typeof EntryServiceActionState = EntryServiceActionState;
  getOrCreateEntryState = EntryServiceActionState.NotStarted;
  updateEntryState = EntryServiceActionState.NotStarted;
  entry: Entry;
  errors: ApiError;
  wordsFormControl = new FormControl('');
  wordsFormControlUnsubscribeNotifier = new Subject();

  constructor(
    private entryService: EntryService) { }

  ngOnInit() {
    this.getOrCreateEntryState = EntryServiceActionState.InProgress;
    this.entryService.getOrCreateEntry().subscribe(
      (result: Entry|ApiError) => {
        if (result instanceof Entry) {
          this.entry = result;
          this.wordsFormControl.setValue(this.entry.words);
          this.createEntryChangeHandler();
          this.getOrCreateEntryState = EntryServiceActionState.Complete;
        } else {
          this.getOrCreateEntryState = EntryServiceActionState.Error;
          this.errors = result;
        }
      });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
      this.removeEntryChangeHandler();
  }

  lastSavedLocalString() {
    return moment(this.entry.finishTime).tz(this.entry.entryTimezone).format('HH:mm:ss');
  }

  milestoneTimeLocalString(): string {
    return moment(this.entry.milestoneTime).tz(this.entry.entryTimezone).format('HH:mm:ss');
  }

  private createEntryChangeHandler() {
    // Check milestone wordcount on every keystroke
    this.wordsFormControl.valueChanges
        .pipe(takeUntil(this.wordsFormControlUnsubscribeNotifier))
        .subscribe(data => {
          this.entry.words = this.wordsFormControl.value;
          this.entry.finishTime = new Date();
          if (!this.entry.milestoneTime && this.entry.countWords() >= this.entry.milestoneWordCount) {
            // Populate the milestone client-side for responsiveness; though the backend calculation will overwrite it
            this.entry.milestoneTime = new Date();
          }
        });

    // Update the entry with a 5-sec sampling interval
    this.wordsFormControl.valueChanges
      .pipe(takeUntil(this.wordsFormControlUnsubscribeNotifier))
      .pipe(sample(observableInterval(5000)))
      .subscribe(data => {
          this.updateEntryState = EntryServiceActionState.InProgress;
          this.entryService.updateEntry(this.entry).subscribe((result: Entry|ApiError) => {
            if (result instanceof Entry) {
              this.entry.words = this.wordsFormControl.value;
              for (const property of ['finishTime', 'milestoneTime']) {
                this.entry[property] = result[property];
              }
              this.updateEntryState = EntryServiceActionState.Complete;
            } else {
              this.updateEntryState = EntryServiceActionState.Error;
              this.errors = result;
            }
        });
      });
  }

  private removeEntryChangeHandler() {
    this.wordsFormControlUnsubscribeNotifier.next(true);
    this.wordsFormControlUnsubscribeNotifier.complete();

    // Send a final update
    this.updateEntryState = EntryServiceActionState.InProgress;
    this.entryService.updateEntry(this.entry).subscribe((result: Entry|ApiError) => {
      if (result instanceof Entry) {
        this.updateEntryState = EntryServiceActionState.Complete;
      } else {
        Sentry.withScope((scope) => {
          scope.setExtra('entry date', this.entry.entryDate);
          scope.setExtra('entry finish time', this.entry.finishTime);
          Sentry.captureException(result);
        });
        this.updateEntryState = EntryServiceActionState.Error;
        this.errors = result;
      }
    });
  }
}
