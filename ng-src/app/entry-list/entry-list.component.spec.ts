import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { RouterLinkStubDirective } from '../../testing/router-stubs';
import { EntryListComponent } from '../entry-list/entry-list.component';
import { ApiDataPage } from '../models/api-data-page';
import { EntryService } from '../services/entry.service';

const entryServiceStub = {
  listEntries(entriesUrl?: string): Observable<ApiDataPage> {
    return Observable.of(new ApiDataPage({count: 0, next: null, previous: null, results: []}));
  }
};

describe('EntryListComponent', () => {
  let component: EntryListComponent;
  let fixture: ComponentFixture<EntryListComponent>;

  beforeEach(async(() => {
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  xit('should paginate', () => {
    expect(false).toBeTruthy();
  });
});
