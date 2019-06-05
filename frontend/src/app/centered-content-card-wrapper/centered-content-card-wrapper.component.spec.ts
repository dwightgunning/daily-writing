import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CenteredContentCardWrapperComponent } from './centered-content-card-wrapper.component';

describe('CenteredContentCardWrapperComponent', () => {
  let component: CenteredContentCardWrapperComponent;
  let fixture: ComponentFixture<CenteredContentCardWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CenteredContentCardWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CenteredContentCardWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
