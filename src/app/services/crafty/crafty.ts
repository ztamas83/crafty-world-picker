import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CraftyResponse,
  FileData,
  Files,
  ServerAction,
  ServerStats,
  SimpleCraftyResponse,
} from '../../models/crafty-api.model';
import { CRAFTY_CONFIG } from './crafty-config';

@Service()
export class Crafty {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CRAFTY_CONFIG);
  readonly serverId = signal(this.config.serverId);

  private readonly baseUrl = computed(() => `/api/v2/servers/${this.serverId()}`);

  async listFiles(path: string) {
    return await firstValueFrom(
      this.http.post<CraftyResponse<Files>>(`${this.baseUrl()}/files`, { path }),
    );
  }

  async readFile(path: string) {
    return await firstValueFrom(
      this.http.post<CraftyResponse<FileData>>(`${this.baseUrl()}/files`, { path }),
    );
  }

  /** Downloads a file as raw bytes. Requires the FILES permission. */
  async downloadFile(path: string): Promise<ArrayBuffer> {
    return await firstValueFrom(
      this.http.get(`${this.baseUrl()}/files/${encodeURIComponent(path)}/download`, {
        responseType: 'arraybuffer',
      }),
    );
  }

  async writeFile(
    path: string,
    contents: string,
    modifiedEpoch: number,
  ): Promise<CraftyResponse<FileData>> {
    return await firstValueFrom(
      this.http.patch<CraftyResponse<FileData>>(`${this.baseUrl()}/files`, {
        path,
        contents,
        modified_epoch: modifiedEpoch,
      }),
    );
  }

  async serverAction(action: ServerAction): Promise<SimpleCraftyResponse> {
    return await firstValueFrom(
      this.http.post<SimpleCraftyResponse>(`${this.baseUrl()}/action/${action}`, {}),
    );
  }

  readonly stats = httpResource<CraftyResponse<ServerStats>>(() => `${this.baseUrl()}/stats`);

  readonly lastError = this.stats.error;
  readonly isLoading = this.stats.isLoading;
  readonly isRunning = computed(() => this.stats.value()?.data.running);
  readonly onlinePlayers = computed(() => this.stats.value()?.data.online);
  readonly maxPlayers = computed(() => this.stats.value()?.data.max);
}
