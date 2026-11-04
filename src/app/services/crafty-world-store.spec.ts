import { TestBed } from '@angular/core/testing';
import { provideCraftyConfig } from './crafty/crafty-config';
import { CraftyWorldStore } from './crafty-world-store';

describe('CraftyWorldStore', () => {
  let service: CraftyWorldStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CraftyWorldStore,
        provideCraftyConfig({ apiToken: 'test-token', serverId: 'test-server' }),
      ],
    });
    service = TestBed.inject(CraftyWorldStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
