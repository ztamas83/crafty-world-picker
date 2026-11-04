import { httpResource } from '@angular/common/http';
import { computed, Service, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { CraftyResponse, ServerStats } from '../models/crafty';

@Service()
export class Crafty {
  readonly serverId = signal(environment.craftyServerId);

  readonly stats = httpResource<CraftyResponse<ServerStats>>(() => ({
    url: `/api/v2/servers/${this.serverId()}/stats`,
    headers: { Authorization: `Bearer ${environment.craftyApiToken}` },
  }));

  readonly lastError = this.stats.error;
  readonly isLoading = this.stats.isLoading;
  readonly isRunning = computed(() => this.stats.value()?.data.running);
  readonly onlinePlayers = computed(() => this.stats.value()?.data.online);
  readonly maxPlayers = computed(() => this.stats.value()?.data.max);
}
