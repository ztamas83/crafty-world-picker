import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorldCard } from './world-card';

describe('WorldCard', () => {
  let component: WorldCard;
  let fixture: ComponentFixture<WorldCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorldCard],
    }).compileComponents();

    fixture = TestBed.createComponent(WorldCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
