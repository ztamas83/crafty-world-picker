import { Component, computed, input, output } from '@angular/core';
import { World } from '../../models/world';
import { WorldSummaryPipe } from '../../world-summary-pipe';

@Component({
  imports: [WorldSummaryPipe],
  selector: 'app-world-card',
  styleUrl: './world-card.scss',
  templateUrl: './world-card.html',
})
export class WorldCard {
  readonly world = input.required<World>();
  readonly startWorld = output<string>();
  protected readonly isActive = computed(() => this.world().status === 'started');
}
