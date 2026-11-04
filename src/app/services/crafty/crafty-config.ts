import { InjectionToken, Provider } from '@angular/core';

export interface CraftyConfig {
  apiToken: string;
  serverId: string;
}

/** Crafty connection settings. Provide with `provideCraftyConfig()`. */
export const CRAFTY_CONFIG = new InjectionToken<CraftyConfig>('CRAFTY_CONFIG');

/** Registers the Crafty connection settings, e.g. in `app.config.ts` or a test. */
export function provideCraftyConfig(config: CraftyConfig): Provider {
  return { provide: CRAFTY_CONFIG, useValue: config };
}
