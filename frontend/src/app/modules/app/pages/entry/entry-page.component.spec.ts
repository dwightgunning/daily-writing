import { Component, EventEmitter, Input, Output  } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { Observable, of, Subject  } from 'rxjs';
import * as Sentry from '@sentry/browser';

import { ApiError } from '../../../../core/models/api-error';
import { Entry } from '../../models/entry';
import { EntryPageComponent } from '../entry/entry-page.component';
import { EntryService, EntryServiceActionState } from '../../services/entry.service';

@Component({selector: 'app-entry-form', template: ''})
class StubEntryFormComponent {
  @Input() entryObs: Observable<Entry>;
  @Output() entryUpdated: EventEmitter<Entry> = new EventEmitter<Entry>();
  @Input() formDisabled: boolean;
}

@Component({selector: 'app-entry-drawer', template: ''})
class StubWritingDrawerComponent {
  @Input() entryObs: Observable<Entry>;
  @Input() updateEntryStateObs: Observable<EntryServiceActionState>;
}

@Component({selector: 'app-page-spinner', template: ''})
class StubPageSpinnerComponent { }

@Component({selector: 'app-page-error', template: ''})
class StubPageErrorComponent { }

describe('EntryPageComponent - writing mode', () => {
  let component: EntryPageComponent;
  let fixture: ComponentFixture<EntryPageComponent>;
  let entryServiceSpy;

  beforeEach(async(() => {
    entryServiceSpy = jasmine.createSpyObj('EntryService', ['getOrCreateEntry', 'updateEntry']);

    TestBed.configureTestingModule({
      declarations: [
        EntryPageComponent,
        StubEntryFormComponent,
        StubPageErrorComponent,
        StubPageSpinnerComponent,
        StubWritingDrawerComponent
      ],
      imports: [],
      providers: [
        { provide: EntryService, useValue: entryServiceSpy },
        { provide: ActivatedRoute, useValue: {
          snapshot: { data: {} }
        }}
      ]
    })
    .compileComponents();
  }));

  describe('initialisation', () => {

    beforeEach(() => {
      fixture = TestBed.createComponent(EntryPageComponent);
      component = fixture.componentInstance;
    });

    afterEach(() => {
      entryServiceSpy.updateEntry.and.returnValue(of(new Entry()));
      component.ngOnDestroy();
    });

    it('enables \'writing\' mode and gets or creates an Entry for the day', () => {
      const testEntry = new Entry({words: 'words..'});
      const deferredGetOrCreateEntryResult = new Subject<Entry|ApiError>();
      entryServiceSpy.getOrCreateEntry.and.returnValue(deferredGetOrCreateEntryResult);
      let getOrCreateEntryState: EntryServiceActionState;
      const subs1 = component.initEntryStateSubj.subscribe(state => getOrCreateEntryState = state);
      let emittedEntry: Entry;
      const subs2 = component.entrySubj.subscribe((entry) => emittedEntry = entry);

      expect(getOrCreateEntryState).toBe(EntryServiceActionState.NotStarted);

      fixture.detectChanges(); // init component

      expect(getOrCreateEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeTruthy();

      deferredGetOrCreateEntryResult.next(testEntry);
      fixture.detectChanges();

      expect(emittedEntry).toEqual(testEntry);
      expect(getOrCreateEntryState).toBe(EntryServiceActionState.Complete);
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#page-error')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#entry-area')).toBeTruthy();

      expect(component.displayTitle).toBe(false);
      expect(component.entryFormDisabled).toBe(false);
    });

    it('enables \'writing\' mode and handles errors when getting or creating the Entry for the day', () => {
      const testApiError = new ApiError({errors: ['An unexpected error occurred. Please try again.']});
      const deferredGetOrCreateEntryResult = new Subject<Entry|ApiError>();
      entryServiceSpy.getOrCreateEntry.and.returnValue(deferredGetOrCreateEntryResult);
      let getOrCreateEntryState: EntryServiceActionState;
      component.initEntryStateSubj.subscribe(state => getOrCreateEntryState = state);

      expect(getOrCreateEntryState).toBe(EntryServiceActionState.NotStarted);

      fixture.detectChanges(); // init component

      expect(getOrCreateEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeTruthy();

      deferredGetOrCreateEntryResult.next(testApiError);
      fixture.detectChanges();

      expect(getOrCreateEntryState).toBe(EntryServiceActionState.Error);
      expect(fixture.nativeElement.querySelector('#page-error')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#entry-area')).toBeFalsy();

      expect(component.displayTitle).toBe(false);
      expect(component.entryFormDisabled).toBe(false);
    });
  });

  describe('entry updates', () => {

    xit('receives and passes on entry updates', () => {});

    xit('updates the entry in the backend every 5 seconds', () => {});

  });

  describe('OnDestroy', () => {
    let deferredUpdateEntryResult: Subject<Entry|ApiError>;

    beforeEach(() => {
      fixture = TestBed.createComponent(EntryPageComponent);
      component = fixture.componentInstance;

      entryServiceSpy.getOrCreateEntry.and.returnValue(of(new Entry()));
      deferredUpdateEntryResult = new Subject();
      entryServiceSpy.updateEntry.and.returnValue(deferredUpdateEntryResult);

      fixture.detectChanges();
    });

    it('Performs a final update of the entry', () => {
      expect(component.updateEntryStateSubj.getValue()).toBe(EntryServiceActionState.NotStarted);
      expect(component.entryUpdateUnsubscribeNotifier.isStopped).toBe(false);

      component.onEntryUpdated(new Entry({words: 'test entry words'}));
      component.ngOnDestroy();

      fixture.detectChanges();
      expect(component.updateEntryStateSubj.getValue()).toBe(EntryServiceActionState.InProgress);
      deferredUpdateEntryResult.next(new Entry());
      deferredUpdateEntryResult.complete();
      fixture.detectChanges();
      expect(component.updateEntryStateSubj.getValue()).toBe(EntryServiceActionState.Complete);
      expect(component.entryUpdateUnsubscribeNotifier.isStopped).toBe(true);
    });

    it('Handles errors making the final update to the entry by logging to Sentry', () => {
      const apiError = new ApiError({errors: ['An unexpected error occurred. Please try again.']});
      let sentryCaptureExceptionSpy;
      const sentryWithScopeSpy = spyOnProperty(Sentry, 'withScope').and.callFake(() => (fn) => {
        sentryCaptureExceptionSpy = jasmine.createSpy('captureException');
        spyOnProperty(Sentry, 'captureException').and.returnValue(sentryCaptureExceptionSpy);
        return fn({setExtra: jasmine.createSpy()});
      });
      expect(component.updateEntryStateSubj.getValue()).toBe(EntryServiceActionState.NotStarted);
      expect(component.entryUpdateUnsubscribeNotifier.isStopped).toBe(false);

      component.onEntryUpdated(new Entry({words: 'test entry words'}));
      component.ngOnDestroy();

      deferredUpdateEntryResult.next(apiError);
      deferredUpdateEntryResult.complete();
      fixture.detectChanges();
      expect(sentryWithScopeSpy).toHaveBeenCalledTimes(1);
      expect(sentryCaptureExceptionSpy).toHaveBeenCalledWith(apiError);
      fixture.detectChanges();
      expect(component.updateEntryStateSubj.getValue()).toBe(EntryServiceActionState.Error);
      expect(component.entryUpdateUnsubscribeNotifier.isStopped).toBe(true);
    });
  });
});

describe('EntryPageComponent - review mode', () => {
  let component: EntryPageComponent;
  let entryServiceSpy;
  let fixture: ComponentFixture<EntryPageComponent>;
  const reviewEntryDate = '2017-10-01';

  beforeEach(async(() => {
    entryServiceSpy = jasmine.createSpyObj('EntryService', ['getEntry']);

    TestBed.configureTestingModule({
      declarations: [
        EntryPageComponent,
        StubEntryFormComponent,
        StubPageErrorComponent,
        StubPageSpinnerComponent,
        StubWritingDrawerComponent
      ],
      providers: [
        { provide: EntryService, useValue: entryServiceSpy },
        { provide: ActivatedRoute,
          useValue: {
            params: of({ entryDate: reviewEntryDate }), // tslint:disable-line deprecation
            snapshot: { data: {mode: 'review' } }
          }
        }
      ]
    })
    .compileComponents();
  }));


  describe('initialisation', () => {

    beforeEach(() => {
      fixture = TestBed.createComponent(EntryPageComponent);
      component = fixture.componentInstance;
    });

    it('enables \'review\' mode and retrieves the Entry for the day', () => {
      const testEntry = new Entry({words: 'words..'});
      const deferredGetEntryResult = new Subject<Entry|ApiError>();
      entryServiceSpy.getEntry.and.returnValue(deferredGetEntryResult);
      let getEntryState: EntryServiceActionState;
      const subs1 = component.initEntryStateSubj.subscribe(state => getEntryState = state);
      let emittedEntry: Entry;
      const subs2 = component.entrySubj.subscribe((entry) => emittedEntry = entry);

      expect(getEntryState).toBe(EntryServiceActionState.NotStarted);

      fixture.detectChanges(); // init component

      expect(getEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeTruthy();

      deferredGetEntryResult.next(testEntry);
      fixture.detectChanges();

      expect(emittedEntry).toEqual(testEntry);
      expect(getEntryState).toBe(EntryServiceActionState.Complete);
      expect(entryServiceSpy.getEntry).toHaveBeenCalledWith(reviewEntryDate);
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#page-error')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#entry-area')).toBeTruthy();

      expect(component.displayTitle).toBe(true);
      expect(component.entryFormDisabled).toBe(true);
    });

    it('enables \'review\' mode and handles errors when getting the Entry for the day', () => {
      const testApiError = new ApiError({errors: ['An unexpected error occurred. Please try again.']});
      const deferredGetEntryResult = new Subject<Entry|ApiError>();
      entryServiceSpy.getEntry.and.returnValue(deferredGetEntryResult);
      let getEntryState: EntryServiceActionState;
      component.initEntryStateSubj.subscribe(state => getEntryState = state);

      expect(getEntryState).toBe(EntryServiceActionState.NotStarted);

      fixture.detectChanges(); // init component

      expect(getEntryState).toBe(EntryServiceActionState.InProgress);
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeTruthy();

      deferredGetEntryResult.next(testApiError);
      fixture.detectChanges();

      expect(getEntryState).toBe(EntryServiceActionState.Error);
      expect(fixture.nativeElement.querySelector('#page-error')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#page-loading')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('#entry-area')).toBeFalsy();

      expect(component.displayTitle).toBe(true);
      expect(component.entryFormDisabled).toBe(true);
    });

  });

});
