import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { EntryReviewPageComponent } from '../entry-review-page/entry-review-page.component';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

const entryServiceStub = {
  getEntry(entry_date: string): Observable<Entry> {
    return Observable.of(new Entry());
  }
};

describe('EntryReviewPageComponent', () => {
  let component: EntryReviewPageComponent;
  let fixture: ComponentFixture<EntryReviewPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EntryReviewPageComponent,
      ],
      imports: [
        FormsModule
      ],
      providers: [
        {provide: EntryService, useValue: entryServiceStub},
        {provide: ActivatedRoute, useValue: {
          params: Observable.of({entry_date: '2017-10-01'})},
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryReviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
