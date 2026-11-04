import { computed, Service, signal } from '@angular/core';
import { World } from '../models/world';
import { mockWorlds } from './mock-world';
import { WorldStore } from './world-store';

@Service({ autoProvided: false })
export class MockWorldStore implements WorldStore {
  private readonly worlds = signal<World[]>(mockWorlds);

  readonly isError = signal(false);
  readonly isLoading = signal(false);
  readonly isBusy = signal(false);

  readonly activeWorld = computed(() => this.worlds().find((w) => w.status === 'started'));

  readonly list = this.worlds.asReadonly();

  async startWorld(id: string): Promise<void> {
    console.log('Start world clicked with id', id);
    this.worlds.update((worlds) =>
      worlds.map((w) => ({ ...w, status: w.id === id ? 'started' : 'stopped' })),
    );
  }

  reload(): void {
    console.log('Reload triggered');
  }
}
