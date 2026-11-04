import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockWorldStore } from '../services/mock-world-store';
import { WorldStore } from '../services/world-store';
import { WorldList } from './world-list';

describe('WorldList', () => {
  let component: WorldList;
  let fixture: ComponentFixture<WorldList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: WorldStore, useClass: MockWorldStore }],
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
