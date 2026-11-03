import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorldList } from './world-list';

describe('WorldList', () => {
  let component: WorldList;
  let fixture: ComponentFixture<WorldList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorldList],
    }).compileComponents();

    fixture = TestBed.createComponent(WorldList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
