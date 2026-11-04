import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { craftyAuthInterceptor } from './services/crafty/crafty-auth.interceptor';
import { provideCraftyConfig } from './services/crafty/crafty-config';
import { CraftyWorldStore } from './services/crafty-world-store';
import { MockWorldStore } from './services/mock-world-store';
import { WorldStore } from './services/world-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([craftyAuthInterceptor])),
    provideCraftyConfig({
      apiToken: environment.craftyApiToken,
      serverId: environment.craftyServerId,
    }),
    {
      provide: WorldStore,
      useClass: environment.useMock ? MockWorldStore : CraftyWorldStore,
    },
  ],
};
