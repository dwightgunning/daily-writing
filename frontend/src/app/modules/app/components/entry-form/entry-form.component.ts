import { Component, EventEmitter, Input, OnInit, OnDestroy, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Entry } from '../../models/entry';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss']
})
export class EntryFormComponent implements OnInit, OnDestroy {
  private entry: Entry;
  @Input() formDisabled: Observable<boolean>;
  @Input() entryObs: Observable<Entry>;
  @Output() entryUpdated: EventEmitter<Entry> = new EventEmitter<Entry>();
  wordsFormControl = new FormControl('');
  wordsFormControlUnsubscribeNotifier = new Subject<boolean>();
  entrySubs: Subscription;

  constructor() { }

  ngOnInit() {
    this.entrySubs = this.entryObs.subscribe((entry) => {
      this.entry = entry;
      if (!this.wordsFormControl.value) {
        this.wordsFormControl.setValue(entry.words, {emitEvent: false});
      }
    });

    // Check milestone wordcount on every keystroke
    this.wordsFormControl.valueChanges
      .pipe(takeUntil(this.wordsFormControlUnsubscribeNotifier))
      .subscribe(data => {
        this.entry.words = this.wordsFormControl.value;
        this.entryUpdated.emit(this.entry);
      });
  }

  ngOnDestroy() {
    this.entrySubs.unsubscribe();
    this.wordsFormControlUnsubscribeNotifier.next(true);
    this.wordsFormControlUnsubscribeNotifier.complete();
  }
}
