import { HttpClient, HttpClientCommonOptions, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CraftyResponse,
  FileData,
  Files,
  ServerAction,
  ServerStats,
  SimpleCraftyResponse,
} from '../models/crafty';

@Service()
export class Crafty {
  private readonly http = inject(HttpClient);
  private options: HttpClientCommonOptions = {
    headers: { Authorization: `Bearer ${environment.craftyApiToken}` },
  };
  readonly serverId = signal(environment.craftyServerId);

  private baseUrl = `/api/v2/servers/${this.serverId()}`;

  async listFiles(path: string) {
    return await firstValueFrom(
      this.http.post<CraftyResponse<Files>>(`${this.baseUrl}/files`, { path }, this.options),
    );
  }

  async readFile(path: string) {
    return await firstValueFrom(
      this.http.post<CraftyResponse<FileData>>(`${this.baseUrl}/files`, { path }, this.options),
    );
  }

  /** Downloads a file as raw bytes. Requires the FILES permission. */
  async downloadFile(path: string): Promise<ArrayBuffer> {
    return await firstValueFrom(
      this.http.get(`${this.baseUrl}/files/${encodeURIComponent(path)}/download`, {
        headers: this.options.headers,
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
      this.http.patch<CraftyResponse<FileData>>(
        `${this.baseUrl}/files`,
        {
          path,
          contents,
          modified_epoch: modifiedEpoch,
        },
        {
          headers: this.options.headers,
        },
      ),
    );
  }

  async serverAction(action: ServerAction): Promise<SimpleCraftyResponse> {
    return await firstValueFrom(
      this.http.post<SimpleCraftyResponse>(
        `${this.baseUrl}/action/${action}`,
        {},
        { headers: this.options.headers },
      ),
    );
  }

  readonly stats = httpResource<CraftyResponse<ServerStats>>(() => ({
    url: `/api/v2/servers/${this.serverId()}/stats`,
    headers: this.options.headers,
  }));

  readonly lastError = this.stats.error;
  readonly isLoading = this.stats.isLoading;
  readonly isRunning = computed(() => this.stats.value()?.data.running);
  readonly onlinePlayers = computed(() => this.stats.value()?.data.online);
  readonly maxPlayers = computed(() => this.stats.value()?.data.max);
}
