import { Signal } from '@angular/core';
import { World } from '../models/world';

export abstract class WorldStore {
  abstract readonly list: Signal<World[]>;
  abstract readonly activeWorld: Signal<World | undefined>;
  abstract readonly isLoading: Signal<boolean>;
  abstract readonly isError: Signal<boolean>;
  abstract startWorld(id: string): void;
}
