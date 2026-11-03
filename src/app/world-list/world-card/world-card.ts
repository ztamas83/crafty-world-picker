import { Component, computed, input, output } from '@angular/core';
import { World } from '../../models/world';

@Component({
  imports: [],
  selector: 'app-world-card',
  styleUrl: './world-card.scss',
  templateUrl: './world-card.html',
})
export class WorldCard {
  readonly world = input.required<World>();
  readonly startWorld = output<string>();
  protected readonly isActive = computed(() => this.world().status === "started");
  protected readonly worldSummary = computed(() =>
      `${this.world().name} · ${this.world().mode} · ${this.world().difficulty}`
  );
}
