import { Component, computed, input, output } from '@angular/core';
import { World } from '../../models/world.model';
import { WorldSummaryPipe } from '../../pipes/world-summary';

@Component({
  imports: [WorldSummaryPipe],
  selector: 'app-world-card',
  styleUrl: './world-card.scss',
  templateUrl: './world-card.html',
})
export class WorldCard {
  readonly world = input.required<World>();
  readonly serverIsBusy = input.required<boolean>();
  readonly startWorld = output<string>();
  protected readonly isActive = computed(() => this.world().status === 'started');
}
