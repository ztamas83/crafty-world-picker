import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
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

  /** Keeps the refresh spinner visible for at least this long, so fast reloads are noticeable. */
  private static readonly MIN_REFRESH_MS = 1000;
  private readonly minRefreshShowing = signal(false);
  private refreshTimer?: ReturnType<typeof setTimeout>;

  /** Spinner shows for the minimum time, or until the reload finishes if that takes longer. */
  protected readonly refreshing = computed(
    () => this.minRefreshShowing() || this.worldsStore.isLoading(),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.refreshTimer));
  }

  protected refreshServer(): void {
    if (this.refreshing()) {
      return;
    }
    this.worldsStore.reload();
    this.minRefreshShowing.set(true);
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.minRefreshShowing.set(false), App.MIN_REFRESH_MS);
  }
}
