import { TestBed } from '@angular/core/testing';
import { MockWorldStore } from './mock-world-store';

describe('WorldStore', () => {
  let service: MockWorldStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MockWorldStore] });
    service = TestBed.inject(MockWorldStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide a list of worlds', () => {
    expect(service.list()).toHaveLength(3);
  });
});
