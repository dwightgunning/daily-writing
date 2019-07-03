import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { of, Observable } from 'rxjs';

import { StubRouterLinkDirective } from '../../../../../testing/router-stubs';
import { EntryListComponent } from '../entry-list/entry-list.component';
import { ApiDataPage } from '../../../../core/models/api-data-page';
import { EntryService } from '../../services/entry.service';

describe('EntryListComponent', () => {
  let component: EntryListComponent;
  let fixture: ComponentFixture<EntryListComponent>;
  let entryServiceSpy: jasmine.SpyObj<EntryService>;

  beforeEach(() => {
    entryServiceSpy = jasmine.createSpyObj('EntryService', ['listEntries']);

    TestBed.configureTestingModule({
      declarations: [
        EntryListComponent,
        StubRouterLinkDirective
      ],
      imports: [],
      providers: [
        {provide: EntryService, useValue: entryServiceSpy }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(EntryListComponent);
    component = fixture.componentInstance;
  });

  xit('should load with spinner', () => {
    this.entryServiceSpy.listEntries.and.returnValue(of(new ApiDataPage({count: 0, next: null, previous: null, results: []})));
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    fixture.whenStable().then(() => { // wait for async
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('#spinner'))).toBeTruthy();
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('#spinner'))).toBeFalsy();
    });
  });


  it('should handle zero entries', () => {
    entryServiceSpy.listEntries.and.returnValue(of(new ApiDataPage({count: 0, next: null, previous: null, results: []})));
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('div').textContent).toContain(
      'No entries. Let\'s start writing');
  });

  it('should handle a single entry', () => {
    entryServiceSpy.listEntries.and.returnValue(of(
      new ApiDataPage({
        count: 0,
        next: null,
        previous: null,
        results: [1]
      })
    ));
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    compiled.querySelector('ul').querySelectorAll('li');
    expect(compiled.querySelector('ul').querySelectorAll('li').length).toBe(1);
  });

});
