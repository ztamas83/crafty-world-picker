import { TestBed } from '@angular/core/testing';
import { CraftyWorldStore } from './crafty-world-store';

describe('CraftyWorldStore', () => {
  let service: CraftyWorldStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CraftyWorldStore],
    });
    service = TestBed.inject(CraftyWorldStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
