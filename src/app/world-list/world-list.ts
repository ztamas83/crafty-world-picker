import { Component, computed, signal } from '@angular/core';
import { mockWorlds } from '../repository/mock-world';
import { WorldCard } from './world-card/world-card';

@Component({
  imports: [WorldCard],
  selector: 'app-world-list',
  styleUrl: './world-list.scss',
  templateUrl: './world-list.html',
})
export class WorldList {
  protected readonly worlds = signal(mockWorlds);

  protected readonly activeWorld = computed(() =>
    this.worlds().find((w) => w.status === 'started'),
  );

  protected startWorld(id: string): void {
    console.log('Start world clicked with id', id);
    this.worlds.update((worlds) =>
      worlds.map((w) => ({ ...w, status: w.id === id ? 'started' : 'stopped' })),
    );
  }
}
