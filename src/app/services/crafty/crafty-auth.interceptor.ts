import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CRAFTY_CONFIG } from './crafty-config';

/** Adds the Crafty API token to requests for the Crafty v2 API. */
export const craftyAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiToken } = inject(CRAFTY_CONFIG);
  if (apiToken && req.url.startsWith('/api/v2/')) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${apiToken}` } }));
  }
  return next(req);
};
