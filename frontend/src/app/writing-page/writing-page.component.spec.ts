import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WritingPageComponent } from '../writing-page/writing-page.component';

@Component({selector: 'app-entry-form', template: ''})
class StubEntryFormComponent {}

describe('WritingPageComponent', () => {
  let component: WritingPageComponent;
  let fixture: ComponentFixture<WritingPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        StubEntryFormComponent,
        WritingPageComponent
      ],
      imports: [],
      providers: []
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WritingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

});
