import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { MomentModule } from 'angular2-moment';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';

import { Entry } from '../models/entry';
import { EntryService } from '../services/entry.service';
import { EntryFormComponent } from './entry-form.component';

const entryServiceStub = {
  getOrCreateEntry(): Observable<Entry> {
    return Observable.of(new Entry());
  }
};

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
        MomentModule
      ],
      providers: [
        {provide: EntryService, useValue: entryServiceStub }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    const entryService = fixture.debugElement.injector.get(EntryService);

    expect(component).toBeTruthy();
  });

  it('should retrieve the day\'s entry on initialisation', () => {
    expect(component).toBeTruthy();
  });

});
