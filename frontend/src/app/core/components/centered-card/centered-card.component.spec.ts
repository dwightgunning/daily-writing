import { Component, TemplateRef, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CenteredCardComponent } from './centered-card.component';

@Component({
    selector: 'app-wrapper-component',
    template: `
    <ng-template #testTemplate>
      <div class='injectedTemplate'></div>
    </ng-template>
    <app-centered-card [centeredRightContentPane]="testTemplate"></app-centered-card>`
  })
export class TestEnclosureComponent { }

describe('CenteredCardComponent', () => {
  /* This test case makes use of an outer enclosing component because the @Input ng-template
   * on CenteredCardComponent (component under test) cannot be
   * accessed programmatically.
   * See: https://github.com/angular/angular/issues/19812
  */
  let enclosureComponent: TestEnclosureComponent;
  let enclosureFixture: ComponentFixture<TestEnclosureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CenteredCardComponent,
        TestEnclosureComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    enclosureFixture = TestBed.createComponent(TestEnclosureComponent);
    enclosureComponent = enclosureFixture.componentInstance;
    enclosureFixture.detectChanges();
  });

  it('should embed the right content pane template input', () => {
    expect(enclosureFixture).toBeTruthy();
    expect(enclosureFixture.nativeElement.querySelector('.injectedTemplate')).not.toBeNull();
  });
});
