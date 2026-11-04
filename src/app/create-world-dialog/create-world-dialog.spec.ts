import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockWorldStore } from '../services/mock-world-store';
import { WorldStore } from '../services/world-store';
import { CreateWorldDialog } from './create-world-dialog';

describe('CreateWorldDialog', () => {
  let component: CreateWorldDialog;
  let fixture: ComponentFixture<CreateWorldDialog>;
  let host: HTMLElement;

  async function typeName(value: string): Promise<void> {
    const input = host.querySelector<HTMLInputElement>('#world-name')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function nameErrors(): string {
    return host.querySelector('#world-name-errors')!.textContent!.trim();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWorldDialog],
      providers: [{ provide: WorldStore, useClass: MockWorldStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateWorldDialog);
    component = fixture.componentInstance;
    host = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows no errors before the field is touched', () => {
    expect(nameErrors()).toBe('');
  });

  it('requires a name', async () => {
    await typeName('');
    expect(nameErrors()).toContain('Name is required.');
    expect(host.querySelector('#world-name')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects path characters', async () => {
    await typeName('../evil');
    expect(nameErrors()).toContain('Use only letters, numbers, spaces, - and _.');
  });

  it('rejects names longer than 40 characters', async () => {
    await typeName('a'.repeat(41));
    expect(nameErrors()).toContain('at most 40 characters');
  });

  it('rejects an existing world name, ignoring case', async () => {
    await typeName('TEST1');
    expect(nameErrors()).toContain('already exists');
  });

  it('accepts a valid new name', async () => {
    await typeName('My new world');
    expect(nameErrors()).toBe('');
    expect(host.querySelector('#world-name')!.getAttribute('aria-invalid')).toBe('false');
  });
});
