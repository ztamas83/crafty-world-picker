import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CraftyResponse,
  FileData,
  Files,
  ServerAction,
  ServerStats,
  SimpleCraftyResponse,
} from '../../models/crafty-api.model';

/**
 * Same-origin path of the Crafty server API. The reverse proxy (nginx in production,
 * `proxy.conf.mjs` in development) maps it to `/api/v2/servers/{CRAFTY_SERVER_ID}` and adds
 * the API token, so neither the token nor the server ID reaches the browser.
 */
export const CRAFTY_SERVER_API = '/api/server';

@Service()
export class Crafty {
  private readonly http = inject(HttpClient);

  async listFiles(path: string) {
    return await firstValueFrom(
      this.http.post<CraftyResponse<Files>>(`${CRAFTY_SERVER_API}/files`, { path }),
    );
  }

  async readFile(path: string) {
    return await firstValueFrom(
      this.http.post<CraftyResponse<FileData>>(`${CRAFTY_SERVER_API}/files`, { path }),
    );
  }

  /** Downloads a file as raw bytes. Requires the FILES permission. */
  async downloadFile(path: string): Promise<ArrayBuffer> {
    return await firstValueFrom(
      this.http.get(`${CRAFTY_SERVER_API}/files/${encodeURIComponent(path)}/download`, {
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
      this.http.patch<CraftyResponse<FileData>>(`${CRAFTY_SERVER_API}/files`, {
        path,
        contents,
        modified_epoch: modifiedEpoch,
      }),
    );
  }

  async serverAction(action: ServerAction): Promise<SimpleCraftyResponse> {
    return await firstValueFrom(
      this.http.post<SimpleCraftyResponse>(`${CRAFTY_SERVER_API}/action/${action}`, {}),
    );
  }

  readonly stats = httpResource<CraftyResponse<ServerStats>>(() => `${CRAFTY_SERVER_API}/stats`);

  readonly lastError = this.stats.error;
  readonly isLoading = this.stats.isLoading;
  readonly isRunning = computed(() => this.stats.value()?.data.running);
  readonly onlinePlayers = computed(() => this.stats.value()?.data.online);
  readonly maxPlayers = computed(() => this.stats.value()?.data.max);
}
