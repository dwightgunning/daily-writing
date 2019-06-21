import { Component, TemplateRef, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CenteredContentCardWrapperComponent } from './centered-content-card-wrapper.component';

@Component({
    selector: 'app-wrapper-component',
    template: `
    <ng-template #testTemplate>
      <div class='injectedTemplate'></div>
    </ng-template>
    <app-centered-content-card-wrapper [centeredRightContentPane]="testTemplate"></app-centered-content-card-wrapper>`
  })
export class TestEnclosureComponent { }

describe('CenteredContentCardWrapperComponent', () => {
  /* This test case makes use of an outer enclosing component because the @Input ng-template
   * on CenteredContentCardWrapperComponent (component under test) cannot be
   * accessed programmatically.
   * See: https://github.com/angular/angular/issues/19812
  */
  let enclosureComponent: TestEnclosureComponent;
  let enclosureFixture: ComponentFixture<TestEnclosureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CenteredContentCardWrapperComponent,
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
