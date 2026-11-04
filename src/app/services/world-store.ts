import { Signal } from '@angular/core';
import { World } from '../models/world';

export abstract class WorldStore {
  abstract readonly list: Signal<World[]>;
  abstract readonly activeWorld: Signal<World | undefined>;
  abstract startWorld(id: string): void;
}
