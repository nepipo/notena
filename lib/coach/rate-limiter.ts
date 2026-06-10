// Sliding-Window Rate-Limiter: 20 Nachrichten pro Stunde pro User.
//
// Persistenz-Upgrade: Map → Redis ersetzen (ZADD/ZREMRANGEBYSCORE/ZCARD).
// Limit anpassen: LIMIT oder WINDOW_MS ändern.

const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 Stunde

interface WindowEntry {
  timestamps: number[];
  // GC-Marker: letzter Cleanup, damit wir nicht bei jedem Request aufräumen
  lastCleanup: number;
}

// Modul-Singleton — überlebt Request-Grenzen im gleichen Node.js-Prozess.
// Bei Serverless (Vercel) wird dieser Zustand pro Instanz gehalten, nicht global.
// Für globale Persistenz: Redis/Upstash verwenden.
const store = new Map<string, WindowEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date; // wann das älteste Token aus dem Fenster fällt
}

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let entry = store.get(userId);
  if (!entry) {
    entry = { timestamps: [], lastCleanup: now };
    store.set(userId, entry);
  }

  // Altes Fenster leeren (nur wenn nötig — spart CPU)
  if (now - entry.lastCleanup > 60_000) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    entry.lastCleanup = now;
  }

  const inWindow = entry.timestamps.filter((t) => t > cutoff);
  const count = inWindow.length;

  if (count >= LIMIT) {
    const oldestInWindow = inWindow[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oldestInWindow + WINDOW_MS),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: LIMIT - (count + 1),
    resetAt: new Date((inWindow[0] ?? now) + WINDOW_MS),
  };
}

// Cleanup: verhindert Memory-Leaks bei sehr vielen inaktiven Usern.
// Empfehlung: alle 30 Min via setInterval aufrufen (oder Cron in Edge-Runtime weglassen).
export function pruneInactiveUsers(): void {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [userId, entry] of store) {
    if (entry.timestamps.every((t) => t <= cutoff)) {
      store.delete(userId);
    }
  }
}
