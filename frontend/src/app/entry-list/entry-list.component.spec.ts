import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { of, Observable } from 'rxjs';

import { RouterLinkStubDirective } from '../../testing/router-stubs';
import { EntryListComponent } from '../entry-list/entry-list.component';
import { ApiDataPage } from '../models/api-data-page';
import { EntryService } from '../services/entry.service';

@Injectable()
export class EntryServiceStub {
  private entries: ApiDataPage;

  public constructor() {
    this.entries = new ApiDataPage(
      {count: 0, next: null, previous: null, results: []});
  }

  set testEntries(entries: ApiDataPage) {
    this.entries = entries;
  }

  listEntries(entriesUrl?: string): Observable<ApiDataPage> {
    return of(this.entries);  // tslint:disable-line deprecation
  }
}


describe('EntryListComponent', () => {
  let component: EntryListComponent;
  let fixture: ComponentFixture<EntryListComponent>;

  const entryServiceStub = new EntryServiceStub();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        EntryListComponent,
        RouterLinkStubDirective
      ],
      imports: [],
      providers: [
        {provide: EntryService, useValue: entryServiceStub }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryListComponent);
    component = fixture.componentInstance;
  });

  xit('should load with spinner', () => {
    const compiled = fixture.debugElement.nativeElement;
    fixture.detectChanges();

    fixture.whenStable().then(() => { // wait for async
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('#spinner'))).toBeTruthy();
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('#spinner'))).toBeFalsy();
    });
  });


  it('should handle zero entries', () => {
    const compiled = fixture.debugElement.nativeElement;

    fixture.detectChanges();
    expect(compiled.querySelector('div').textContent).toContain(
      'No entries. Let\'s start writing');
  });

  it('should handle a single entry', () => {
    const compiled = fixture.debugElement.nativeElement;
    entryServiceStub.testEntries = new ApiDataPage({
      count: 0,
      next: null,
      previous: null,
      results: [1]
    });
    fixture.detectChanges();

    compiled.querySelector('ul').querySelectorAll('li');
    expect(compiled.querySelector('ul').querySelectorAll('li').length).toBe(1);
  });

});
