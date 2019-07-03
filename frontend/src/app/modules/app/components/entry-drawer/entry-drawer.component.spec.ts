import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { of, Subject  } from 'rxjs';

import { DEFAULT_MILESTONE_WORD_COUNT, Entry } from '../../models/entry';
import { EntryDrawerComponent } from './entry-drawer.component';

describe('EntryDrawerComponent', () => {
  let component: EntryDrawerComponent;
  let fixture: ComponentFixture<EntryDrawerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntryDrawerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryDrawerComponent);
    component = fixture.componentInstance;
  });

  it('renders and updates the draw as the entry input changes', () => {
    const deferredEntry = new Subject<Entry>();
    component.entryObs = deferredEntry;

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#entry-drawer')).toBeFalsy();

    deferredEntry.next(new Entry({}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#entry-drawer')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#word-count').textContent).toContain(`0 / ${DEFAULT_MILESTONE_WORD_COUNT}`);
    expect(fixture.nativeElement.querySelector('#modified-time')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('#milestone-time')).toBeFalsy();

    deferredEntry.next(new Entry({words: 'one two three'}));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#word-count').textContent).toContain(`3 / ${DEFAULT_MILESTONE_WORD_COUNT}`);
  });


  it('renders the milestone-time only when it is reached', () => {
    const testData = {
      words: 'one two',
      milestoneWordCount: 3,
      milestoneTime: new Date(),
      modifiedDate: new Date(),
    };
    let testEntry = new Entry(testData);
    const deferredEntry = new Subject<Entry>();
    component.entryObs = deferredEntry;

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#milestone-time')).toBeFalsy();
    deferredEntry.next(new Entry(testData));

    testData.words = 'one two three four';
    testEntry = new Entry(testData);
    deferredEntry.next(testEntry);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#milestone-time').textContent).toContain(testEntry.milestoneTimeLocalString());
  });
});
