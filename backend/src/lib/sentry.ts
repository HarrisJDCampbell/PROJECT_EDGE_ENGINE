import * as Sentry from '@sentry/node';

const DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!DSN) {
    console.log('[Sentry] No SENTRY_DSN set — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    beforeSend(event) {
      // Strip sensitive headers before sending to Sentry
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

export { Sentry };
