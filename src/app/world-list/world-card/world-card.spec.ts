import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockWorlds } from '../../services/mock-world';
import { MockWorldStore } from '../../services/mock-world-store';
import { WorldStore } from '../../services/world-store';
import { WorldCard } from './world-card';

describe('WorldCard', () => {
  let component: WorldCard;
  let fixture: ComponentFixture<WorldCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: WorldStore, useClass: MockWorldStore }],
      imports: [WorldCard],
    }).compileComponents();

    fixture = TestBed.createComponent(WorldCard);
    fixture.componentRef.setInput('world', mockWorlds[0]);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
