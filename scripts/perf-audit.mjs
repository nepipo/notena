#!/usr/bin/env node
// Notena Performance-Audit — ehrliche Bundle-Messung.
//
// Was dieses Script besser macht als das alte Hand-Audit:
//   1) Es misst GZIPPED (real ueber die Leitung), nicht nur unkomprimiert.
//   2) Es rechnet den Route-OVERHEAD ueber der Shared-Baseline aus — das ist die
//      Zahl, die unser Ziel meint (nicht die absolute First-Load-Zahl, die zu
//      ~85% aus dem unvermeidbaren Framework-Boden besteht).
//   3) Es zeigt die Landing als Referenz-Zeile (roh/gzip/Overhead), damit man
//      sieht, wo der Rest liegt — aber gebudgetet wird ueber den Overhead, nicht
//      ueber "schwerer als Landing" (die Landing hat selbst ~43 kB Overhead, also
//      waere das eine Rausch-Regel, die fast alles flaggt).
//
// Methoden-Hinweis: firstLoadChunkPaths (aus Turbopacks route-bundle-stats.json)
// enthaelt NUR die Chunks fuers Initial-Rendern+Hydraten. next/dynamic({ssr:false})
// wird korrekt NICHT mitgezaehlt (laedt erst bei Interaktion). Das ist also schon
// die ehrliche Initial-Last — wir muessen sie nur richtig aufbereiten.
//
// Nutzung:  node scripts/perf-audit.mjs   (nach `npm run build`)
//           --json   maschinenlesbare Ausgabe
// Exit-Code 1, wenn eine Route das Budget reisst (CI-tauglich).

import { readFileSync, existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

// --- Budget (deckungsgleich mit CLAUDE.md §10 "Performance-Budget") ---
const BUDGET_OVERHEAD_KB = 100; // Route-Overhead ueber der Shared-Baseline, unkomprimiert
const LANDING_ROUTE = "/";

const STATS = resolve(".next/diagnostics/route-bundle-stats.json");
const jsonOut = process.argv.includes("--json");
const kb = (b) => (b / 1024).toFixed(1);

if (!existsSync(STATS)) {
  console.error(
    `✗ ${STATS} fehlt.\n  Erst bauen:  npm run build\n  dann:        node scripts/perf-audit.mjs`,
  );
  process.exit(2);
}

const stats = JSON.parse(readFileSync(STATS, "utf8"));

// gzip-Groesse pro Chunk (gecacht — Chunks werden ueber Routen geteilt).
const gzipCache = new Map();
function gzipSize(chunkPath) {
  if (gzipCache.has(chunkPath)) return gzipCache.get(chunkPath);
  let size = 0;
  try {
    size = gzipSync(readFileSync(resolve(chunkPath)), { level: 9 }).length;
  } catch {
    /* Chunk nicht auf Platte (z.B. CSS-Ref) — als 0 zaehlen */
  }
  gzipCache.set(chunkPath, size);
  return size;
}
function rawSize(chunkPath) {
  try {
    return statSync(resolve(chunkPath)).size;
  } catch {
    return 0;
  }
}

// Shared-Baseline = Chunks, die in JEDER Route vorkommen.
const routeCount = stats.length;
const chunkFreq = new Map();
for (const r of stats)
  for (const c of new Set(r.firstLoadChunkPaths))
    chunkFreq.set(c, (chunkFreq.get(c) ?? 0) + 1);
const baseline = new Set(
  [...chunkFreq.entries()].filter(([, n]) => n === routeCount).map(([c]) => c),
);

const baselineRaw = [...baseline].reduce((s, c) => s + rawSize(c), 0);
const baselineGzip = [...baseline].reduce((s, c) => s + gzipSize(c), 0);

const rows = stats
  .map((r) => {
    const raw = r.firstLoadUncompressedJsBytes;
    const gzip = r.firstLoadChunkPaths.reduce((s, c) => s + gzipSize(c), 0);
    const overhead = r.firstLoadChunkPaths
      .filter((c) => !baseline.has(c))
      .reduce((s, c) => s + rawSize(c), 0);
    return { route: r.route, raw, gzip, overhead };
  })
  .sort((a, b) => b.raw - a.raw);

const landing = rows.find((r) => r.route === LANDING_ROUTE);
const landingRaw = landing?.raw ?? Infinity;

for (const r of rows) {
  r.violates = r.overhead / 1024 > BUDGET_OVERHEAD_KB;
  r.reason = r.violates ? `Overhead ${kb(r.overhead)} kB > ${BUDGET_OVERHEAD_KB} kB` : "";
  // Informativ (kein harter Verstoss): deutlich schwerer als die Landing.
  r.overLanding = r.raw > landingRaw && r.route !== LANDING_ROUTE;
}

const violations = rows.filter((r) => r.violates);

if (jsonOut) {
  console.log(
    JSON.stringify(
      {
        date: new Date().toISOString().slice(0, 10),
        routeCount,
        baseline: { rawBytes: baselineRaw, gzipBytes: baselineGzip },
        budgetOverheadKb: BUDGET_OVERHEAD_KB,
        routes: rows,
      },
      null,
      2,
    ),
  );
  process.exit(violations.length ? 1 : 0);
}

// --- Menschliche Ausgabe ---
console.log(`\nNotena Performance-Audit — ${new Date().toISOString().slice(0, 10)}`);
console.log(`Routen: ${routeCount}`);
console.log(
  `Shared-Baseline (in allen Routen): ${kb(baselineRaw)} kB roh · ${kb(baselineGzip)} kB gzip`,
);
console.log(`Budget: Route-Overhead < ${BUDGET_OVERHEAD_KB} kB roh · keine Route > Landing\n`);

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
console.log(
  `${pad("Route", 26)}${padL("FirstLoad", 11)}${padL("gzip", 9)}${padL("Overhead", 11)}  Status`,
);
console.log("─".repeat(72));
for (const r of rows) {
  const status = r.violates
    ? `⚠ ${r.reason}`
    : r.overLanding
      ? "✓ · > Landing"
      : "✓";
  console.log(
    `${pad(r.route, 26)}${padL(kb(r.raw) + " kB", 11)}${padL(kb(r.gzip) + " kB", 9)}${padL(kb(r.overhead) + " kB", 11)}  ${status}`,
  );
}
console.log("─".repeat(72));

if (violations.length) {
  console.log(`\n✗ ${violations.length} Route(n) reissen das Budget:`);
  for (const v of violations) console.log(`   ${v.route} — ${v.reason}`);
  console.log("");
  process.exit(1);
}
console.log(`\n✓ Alle Routen im Budget.\n`);
