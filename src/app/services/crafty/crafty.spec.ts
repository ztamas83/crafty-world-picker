import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Crafty } from './crafty';

describe('Crafty', () => {
  let service: Crafty;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Crafty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
