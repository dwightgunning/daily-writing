import { Component } from '@angular/core';
import { async, fakeAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MomentModule } from 'ngx-moment';
import { BehaviorSubject, of, Observable, Subject, throwError  } from 'rxjs';

import { ApiError } from '../../../../core/models/api-error';
import { Entry } from '../../models/entry';
import { EntryService } from '../../services/entry.service';
import { EntryFormComponent } from './entry-form.component';

describe('EntryFormComponent', () => {
  let component: EntryFormComponent;
  let fixture: ComponentFixture<EntryFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EntryFormComponent
      ],
      imports: [
        FormsModule,
        ReactiveFormsModule
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryFormComponent);
    component = fixture.componentInstance;

  });

  it('updates the word count and emits the updated entry', (done: DoneFn) => {
    const testWords = 'Some test words.';
    component.entryObs = of(new Entry());
    fixture.detectChanges();

    component.entryUpdated.subscribe((entry) => {
      expect(entry.words).toEqual(testWords);
      done();
    });
    component.wordsFormControl.setValue(testWords);
  });

  it('Unsubscribes from the Entry observable input when the component is destroyed', () => {
    const entrySubj = new BehaviorSubject<Entry>(new Entry());
    component.entryObs = entrySubj;
    fixture.detectChanges();
    expect(entrySubj.observers.length).toBe(1); // Todo: Properly assert the actual observer
    component.ngOnDestroy();
    expect(entrySubj.observers.length).toBe(0);
  });
});
