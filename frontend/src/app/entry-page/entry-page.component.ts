import { Component, OnDestroy, OnInit } from '@angular/core';

import * as moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min';
import { BehaviorSubject, interval, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { filter, sample, takeUntil, tap, switchMap } from 'rxjs/operators';
import * as Sentry from '@sentry/browser';

import { ApiError } from '../models/api-error';
import { Entry } from '../models/entry';
import { EntryService, EntryServiceActionState } from '../services/entry.service';

@Component({
  selector: 'app-entry-page',
  templateUrl: './entry-page.component.html',
  styleUrls: ['./entry-page.component.scss']
})
export class EntryPageComponent implements OnInit, OnDestroy {
  EntryServiceActionState: typeof EntryServiceActionState = EntryServiceActionState;
  getOrCreateEntryStateSubj = new BehaviorSubject<EntryServiceActionState>(EntryServiceActionState.NotStarted);
  updateEntryStateSubj = new BehaviorSubject<EntryServiceActionState>(EntryServiceActionState.NotStarted);
  private entry: Entry;
  entrySubj = new ReplaySubject<Entry>(1);
  entryUpdateUnsubscribeNotifier = new Subject<boolean>();
  errors: ApiError;

  constructor(private entryService: EntryService) { }

  ngOnInit() {
    this.getOrCreateEntryStateSubj.next(EntryServiceActionState.InProgress);
    this.entryService.getOrCreateEntry().subscribe(
      (result: Entry|ApiError) => {
        if (result instanceof Entry) {
          this.entry = Object.assign(new Entry(), result);
          this.entrySubj.next(result);
          this.createEntryChangeHandler();
          this.getOrCreateEntryStateSubj.next(EntryServiceActionState.Complete);
        } else {
          this.getOrCreateEntryStateSubj.next(EntryServiceActionState.Error);
          this.errors = result;
        }
      });
  }

  ngOnDestroy() {
    this.entryUpdateUnsubscribeNotifier.next(true);
    this.entryUpdateUnsubscribeNotifier.complete();
    this.attemptLastEntryUpdate();
  }

  onEntryUpdated(entry: Entry) {
    this.entrySubj.next(entry);
  }

  private createEntryChangeHandler() {
    this.entrySubj
      .pipe(
        takeUntil(this.entryUpdateUnsubscribeNotifier),
        sample(interval(5000)),
        // TODO: Refactor such that subscription doesn't rely on external scope
        filter(entry => this.entry.words !== entry.words), // tslint:disable-line rxjs-no-unsafe-scope
        tap(() => this.updateEntryStateSubj.next(EntryServiceActionState.InProgress)),
        switchMap(entry => this.entryService.updateEntry(entry))
      ).subscribe((result: Entry|ApiError) => {
        if (result instanceof Entry) {
          this.updateEntryStateSubj.next(EntryServiceActionState.Complete);
          Object.assign(this.entry, result);
          this.entrySubj.next(result);
        } else {
          this.updateEntryStateSubj.next(EntryServiceActionState.Error);
          this.errors = result;
        }
      });
  }

  private attemptLastEntryUpdate() {
    let entryToUpdate: Entry; // TODO: Refactor such that subscription doesn't rely on external scope
    this.updateEntryStateSubj.next(EntryServiceActionState.InProgress);
    this.entrySubj.pipe(
      filter(entry => this.entry.words !== entry.words), // tslint:disable-line rxjs-no-unsafe-scope
      switchMap(entry => {
        entryToUpdate = entry; // tslint:disable-line rxjs-no-unsafe-scope
        return this.entryService.updateEntry(entry);
      })
    ).subscribe((result: Entry|ApiError) => {
      if (result instanceof Entry) {
        this.updateEntryStateSubj.next(EntryServiceActionState.Complete);
      } else {
        this.updateEntryStateSubj.next(EntryServiceActionState.Error);
        Sentry.withScope((scope) => {
          scope.setExtra('entry date', entryToUpdate.entryDate);
          scope.setExtra('entry finish time', entryToUpdate.finishTime);
          Sentry.captureException(result);
        });
        this.errors = result;
      }
    });
  }
}
