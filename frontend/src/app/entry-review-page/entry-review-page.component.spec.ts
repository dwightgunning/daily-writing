import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { of, Observable } from 'rxjs';

import { EntryReviewPageComponent } from '../entry-review-page/entry-review-page.component';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';

const entryServiceStub = {
  getEntry(entryDate: string): Observable<Entry> {
    return of(new Entry());  // tslint:disable-line deprecation
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
          params: of({entryDate: '2017-10-01'})}, // tslint:disable-line deprecation
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
