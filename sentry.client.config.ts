import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://edca77a46decb52f768a2bb44a183900@o4511574541926400.ingest.de.sentry.io/4511574545334352",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
