import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { MomentModule } from 'angular2-moment';

import { AuthService } from '../services/auth.service';
import { EntryFormComponent } from './entry-form.component';
import { EntryService } from '../services/entry.service';

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
        HttpClientModule,
        MomentModule
      ],
      providers: [
        AuthService,
        EntryService
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
    expect(component).toBeTruthy();
  });
});
