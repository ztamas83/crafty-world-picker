import { Component, computed, inject, signal } from '@angular/core';
import { CreateWorldDialog } from './create-world-dialog/create-world-dialog';
import { WorldStore } from './services/world-store';
import { WorldList } from './world-list/world-list';

@Component({
  imports: [WorldList, CreateWorldDialog],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Crafty World Picker');
  protected readonly worldsStore = inject(WorldStore);
  protected readonly errorMessage = computed(() => {
    if (this.worldsStore.isError()) {
      return 'Failed to load data, see logs!';
    }
    return undefined;
  });

  protected refreshServer(event?: unknown): void {
    console.log('Refreshed by', event);
    this.worldsStore.reload();
  }
}
