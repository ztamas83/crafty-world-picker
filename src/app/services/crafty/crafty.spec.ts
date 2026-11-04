import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Crafty } from './crafty';
import { provideCraftyConfig } from './crafty-config';

describe('Crafty', () => {
  let service: Crafty;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideCraftyConfig({ apiToken: 'test-token', serverId: 'test-server' }),
      ],
    });
    service = TestBed.inject(Crafty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
