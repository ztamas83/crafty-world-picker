import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Crafty } from './services/crafty';
import { WorldStore } from './services/world-store';
import { WorldList } from './world-list/world-list';
import { WorldSummaryPipe } from './world-summary-pipe';

@Component({
  imports: [RouterOutlet, WorldList, WorldSummaryPipe],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly server = inject(Crafty);
  protected readonly title = signal('Crafty World Picker');
  protected readonly worldsStore = inject(WorldStore);
  protected readonly errorMessage = computed(() => {
    if (this.server.lastError()) {
      return 'Failed to load data, see logs!';
    }
    return undefined;
  });

  protected refreshServer(): void {
    this.server.stats.reload();
  }
}
