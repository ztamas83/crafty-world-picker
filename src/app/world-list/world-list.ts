import { Component, inject } from '@angular/core';
import { WorldStore } from '../services/world-store';
import { WorldCard } from './world-card/world-card';

@Component({
  imports: [WorldCard],
  selector: 'app-world-list',
  styleUrl: './world-list.scss',
  templateUrl: './world-list.html',
})
export class WorldList {
  protected readonly worldsStore = inject(WorldStore);
}
