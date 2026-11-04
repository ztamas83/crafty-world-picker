import { computed, Service, signal } from '@angular/core';
import { NewWorld, World } from '../models/world.model';
import { mockWorlds } from './mock-worlds.data';
import { WorldStore } from './world-store';

@Service({ autoProvided: false })
export class MockWorldStore implements WorldStore {
  private readonly worlds = signal<World[]>(mockWorlds);

  readonly serverId = signal('mock-server-id');
  readonly isError = signal(false);
  readonly isLoading = signal(false);
  readonly isInitialLoading = signal(false);
  readonly isBusy = signal(false);

  readonly activeWorld = computed(() => this.worlds().find((w) => w.status === 'started'));
  readonly isServerRunning = computed(() => this.activeWorld() !== undefined);
  readonly onlinePlayers = signal(0);
  readonly maxPlayers = signal(20);

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

  async createWorld(world: NewWorld): Promise<void> {
    this.worlds.update((ws) => [
      ...ws.map((w) => ({ ...w, status: 'stopped' as const })),
      { ...world, id: world.name, status: 'started' },
    ]);
  }
}
