import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://edca77a46decb52f768a2bb44a183900@o4511574541926400.ingest.de.sentry.io/4511574545334352",
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  // replayIntegration wird lazy geladen (siehe unten) — spart ~70-100 kB vom initialen Bundle
});

Sentry.lazyLoadIntegration("replayIntegration")
  .then((replayIntegration) => {
    Sentry.addIntegration(replayIntegration({ maskAllText: true, blockAllMedia: true }));
  })
  .catch(() => {
    // Sentry Replay ist optional — silently fail
  });
