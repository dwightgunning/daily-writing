import { Component } from '@angular/core';
import { async, fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MomentModule } from 'ngx-moment';
import { of, Observable, Subject, throwError  } from 'rxjs';
import * as Sentry from '@sentry/browser';

import { ApiError } from '../models/api-error';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';
import { EntryFormComponent, EntryServiceActionState } from './entry-form.component';

@Component({selector: 'app-page-spinner', template: ''})
class StubPageSpinnerComponent { }

@Component({selector: 'app-page-error', template: ''})
class StubPageErrorComponent { }

describe('EntryFormComponent', () => {
  let component: EntryFormComponent;
  let fixture: ComponentFixture<EntryFormComponent>;
  let entryServiceSpy;

  beforeEach(async(() => {
    entryServiceSpy = jasmine.createSpyObj('EntryService', ['getOrCreateEntry', 'updateEntry']);

    TestBed.configureTestingModule({
      declarations: [
        EntryFormComponent,
        StubPageErrorComponent,
        StubPageSpinnerComponent
      ],
      imports: [
        FormsModule,
        MomentModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: EntryService, useValue: entryServiceSpy }
      ]
    })
    .compileComponents();
  }));

  describe('initialisation', () => {

    beforeEach(() => {
      fixture = TestBed.createComponent(EntryFormComponent);
      component = fixture.componentInstance;
    });

    afterEach(() => {
        const updateEntrySpy = entryServiceSpy.updateEntry.and.callFake(
        (data) => {
          return of(new Entry());
        });
        fixture.detectChanges();
        fixture.destroy();
        entryServiceSpy.getOrCreateEntry.calls.reset();
        entryServiceSpy.updateEntry.calls.reset();
    });

    it('initialises: with new entry: populates the entry form writing area and metadata', (onExpectationsMet: DoneFn) => {
      const getOrCreateEntrySpy = entryServiceSpy.getOrCreateEntry.and.callFake(
      (data) => {
        onExpectationsMet();
        return of(new Entry());
      });
      fixture.detectChanges();

      // complete with entry words field populated
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Complete);
      expect(fixture.nativeElement.querySelector('#words').value).toBe('');
      expect(fixture.nativeElement.querySelector('#wordCount').textContent).toContain(0);
      expect(fixture.nativeElement.querySelector('#finishTime')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#milestoneTime')).toBeFalsy();
    });

    it('Existing entry with Milestone not met: populates the entry form writing area and metadata', () => {
      // Subject used in order to defer emitting the result so the intermediate state can tested
      const deferredGetOrCreateEntryResult = new Subject();
      entryServiceSpy.getOrCreateEntry.and.returnValue(deferredGetOrCreateEntryResult);
      const testEntry = new Entry({
        words: 'An existing entry',
        finishTime: new Date(),
        milestoneTime: null,
      });

      fixture.detectChanges();

      // in progress with spinner
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#inProgressSpinner')).toBeTruthy();

      deferredGetOrCreateEntryResult.next(testEntry);
      deferredGetOrCreateEntryResult.complete();

      fixture.detectChanges();

      // complete with entry words field populated
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Complete);
      expect(fixture.nativeElement.querySelector('#words').value).toContain(testEntry.words);
      expect(fixture.nativeElement.querySelector('#wordCount').textContent).toContain(3);
      expect(fixture.nativeElement.querySelector('#finishTime').textContent).toContain(component.lastSavedLocalString());
      expect(fixture.nativeElement.querySelector('#milestoneTime')).toBeFalsy();
    });

    it('Existing entry with Milestone met: populates the entry form writing area and metadata', () => {
      // Subject used in order to defer emitting the result so the intermediate state can tested
      const deferredGetOrCreateEntryResult = new Subject();
      entryServiceSpy.getOrCreateEntry.and.returnValue(deferredGetOrCreateEntryResult);
      const testEntry = new Entry({
        words: 'An existing entry',
        finishTime: new Date(),
        milestoneTime: new Date(),
      });

      fixture.detectChanges();

      // in progress with spinner
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#inProgressSpinner')).toBeTruthy();

      deferredGetOrCreateEntryResult.next(testEntry);
      deferredGetOrCreateEntryResult.complete();

      fixture.detectChanges();

      // complete with entry words field populated
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Complete);
      expect(fixture.nativeElement.querySelector('#words').value).toContain(testEntry.words);
      expect(fixture.nativeElement.querySelector('#wordCount').textContent).toContain(3);
      expect(fixture.nativeElement.querySelector('#finishTime').textContent).toContain(component.lastSavedLocalString());
      expect(fixture.nativeElement.querySelector('#milestoneTime').textContent).toContain(component.milestoneTimeLocalString());
    });

    it('handles errors when getting or creating the Entry for the day', (onExpectationsMet) => {
      const getOrCreateEntrySpy = entryServiceSpy.getOrCreateEntry.and.callFake(
        (data) => {
          onExpectationsMet();
          return of(new ApiError({errors: ['An unexpected error occurred. Please try again.']}));
        });
      fixture.detectChanges();

      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Error);
      expect(fixture.nativeElement.querySelector('#appError')).toBeTruthy();
    });
  });

  describe('handles user input into the words textarea', () => {

    beforeEach(() => {
      fixture = TestBed.createComponent(EntryFormComponent);
      component = fixture.componentInstance;
    });

    afterEach(() => {
        const updateEntrySpy = entryServiceSpy.updateEntry.and.callFake(
        (data) => {
          return of(new Entry());
        });
        fixture.detectChanges();
        fixture.destroy();
        entryServiceSpy.getOrCreateEntry.calls.reset();
        entryServiceSpy.updateEntry.calls.reset();
    });

    it('updates the word count and model finish time immediately', () => {
      const getOrCreateEntrySpy = entryServiceSpy.getOrCreateEntry.and.callFake((data) => {
        return of(new Entry());
      });
      fixture.detectChanges();
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Complete);

      const testWords = 'This is a six word sentence.';
      const wordsField = fixture.nativeElement.querySelector('#words');
      wordsField.value = testWords;
      wordsField.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.entry.words).toBe(testWords);
      expect(fixture.nativeElement.querySelector('#wordCount').textContent).toContain(6);
      expect(fixture.nativeElement.querySelector('#finishTime').textContent).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#milestoneTime')).toBeFalsy();
      fixture.detectChanges();
    });

    xit('updates the entry in the backend every 5 seconds', () => {});

    it('updates the milestone timestamp once, when it is reached', () => {
      const getOrCreateEntrySpy = entryServiceSpy.getOrCreateEntry.and.callFake((data) => {
        return of(new Entry({
          words: 'This is a test',
          milestoneWordCount: 5,
          finishTime: new Date(),
        }));
      });
      fixture.detectChanges();
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Complete);

      const testWords = 'This is a six word sentence.';
      const wordsField = fixture.nativeElement.querySelector('#words');
      wordsField.value = testWords;
      wordsField.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Milestone time is set
      expect(component.entry.words).toBe(testWords);
      expect(component.entry.milestoneTime).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#wordCount').textContent).toContain(6);
      expect(fixture.nativeElement.querySelector('#finishTime').textContent).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#milestoneTime').textContent).toBeTruthy();
      fixture.detectChanges();

      // capture the initial finish and milestone times
      const initialFinishTime = component.entry.finishTime;
      const initialMilestoneTime = component.entry.milestoneTime;

      // modify the entry
      wordsField.value = 'This is a modification to the entry.';
      wordsField.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // milestone time is unchanged
      expect(component.entry.finishTime).not.toBe(initialFinishTime);
      expect(component.entry.milestoneTime).toBe(initialMilestoneTime);
    });

    xit('handles errors when updating the entry in the backend', () => {});

  });

  describe('OnDestroy', () => {

    beforeEach(() => {
      fixture = TestBed.createComponent(EntryFormComponent);
      component = fixture.componentInstance;
      entryServiceSpy.getOrCreateEntry.and.callFake(
        (data) => {
          return of(new Entry());
        }
      );
      fixture.detectChanges();
    });

    it('Performs a final update of the entry', () => {
      const deferredUpdateEntryResult = new Subject();
      entryServiceSpy.updateEntry.and.returnValue(deferredUpdateEntryResult);
      const testEntry = new Entry({
        words: 'An existing entry',
        finishTime: new Date(),
        milestoneTime: null,
      });
      expect(component.getOrCreateEntryState).toBe(EntryServiceActionState.Complete);
      expect(component.updateEntryState).toBe(EntryServiceActionState.NotStarted);
      expect(component.wordsFormControlUnsubscribeNotifier.isStopped).toBe(false);

      component.ngOnDestroy();

      // change: update in progress
      fixture.detectChanges();
      expect(component.updateEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#updateInProgressSpinner')).toBeTruthy();

      // emit update result
      deferredUpdateEntryResult.next(testEntry);
      deferredUpdateEntryResult.complete();

      // change: update complete
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#updateInProgressSpinner')).toBeFalsy();
      expect(component.updateEntryState).toBe(EntryServiceActionState.Complete);

      // Subscriptions stopped
      expect(component.wordsFormControlUnsubscribeNotifier.isStopped).toBe(true);
    });

    it('Handles errors making the final update to the entry by logging to Sentry', () => {
      const apiError = new ApiError({errors: ['An unexpected error occurred. Please try again.']});

      const deferredUpdateEntryResult = new Subject();
      entryServiceSpy.updateEntry.and.returnValue(deferredUpdateEntryResult);

      let sentryCaptureExceptionSpy;
      const sentryWithScopeSpy = spyOnProperty(Sentry, 'withScope').and.callFake(() => (fn) => {
        sentryCaptureExceptionSpy = jasmine.createSpy('captureException');
        spyOnProperty(Sentry, 'captureException').and.returnValue(sentryCaptureExceptionSpy);
        return fn({setExtra: jasmine.createSpy()});
      });

      component.ngOnDestroy();

      // emit update result
      deferredUpdateEntryResult.next(apiError);
      deferredUpdateEntryResult.complete();

      // change: update errorred
      fixture.detectChanges();
      expect(sentryWithScopeSpy).toHaveBeenCalledTimes(1);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledWith(apiError);

      // change: update complete
      fixture.detectChanges();
      expect(component.updateEntryState).toBe(EntryServiceActionState.Error);

      // Subscriptions stopped
      expect(component.wordsFormControlUnsubscribeNotifier.isStopped).toBe(true);
    });
  });

});
