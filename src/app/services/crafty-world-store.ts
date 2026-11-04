import { computed, Service, signal } from '@angular/core';
import { World } from '../models/world';
import { WorldStore } from './world-store';

@Service({ autoProvided: false })
export class CraftyWorldStore implements WorldStore {
  private readonly worlds = signal<World[]>([]);

  readonly activeWorld = computed(() => this.worlds().find((w) => w.status === 'started'));

  readonly list = this.worlds.asReadonly();

  startWorld(id: string): void {
    console.log('Start world clicked with id', id);
    this.worlds.update((worlds) =>
      worlds.map((w) => ({ ...w, status: w.id === id ? 'started' : 'stopped' })),
    );
  }
}
