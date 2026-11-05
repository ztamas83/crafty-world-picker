import { Signal } from '@angular/core';
import { NewWorld, World } from '../models/world.model';

export abstract class WorldStore {
  abstract readonly isServerRunning: Signal<boolean>;
  abstract readonly onlinePlayers: Signal<number>;
  abstract readonly maxPlayers: Signal<number>;
  abstract readonly list: Signal<World[]>;
  abstract readonly activeWorld: Signal<World | undefined>;
  /** True during any load, including a refresh. */
  abstract readonly isLoading: Signal<boolean>;
  /** True only while the first load runs (no data to show yet). */
  abstract readonly isInitialLoading: Signal<boolean>;
  abstract readonly isBusy: Signal<boolean>;
  abstract readonly isError: Signal<boolean>;
  abstract startWorld(id: string): Promise<void>;
  abstract createWorld(world: NewWorld): Promise<void>;
  abstract reload(): void;
}
