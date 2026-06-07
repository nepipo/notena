/**
 * Schulferien-Daten für alle 16 Bundesländer.
 * Sommerferien 2026: Quelle ADAC (adac.de/news/reise-sommerferien-deutschland-2026)
 * Herbstferien 2026: Quelle schulferienkalender24.de
 * Weihnachtsferien 2026/27: Quelle kalenderpedia.de
 * Hamburg 2026 komplett: Quelle kalenderpedia.de + schulbuchverlag.de
 * Bitte jährlich gegen https://www.kmk.org/service/ferienregelung.html prüfen.
 */

export type Bundesland =
  | "BW" | "BY" | "BE" | "BB" | "HB" | "HH"
  | "HE" | "MV" | "NI" | "NW" | "RP" | "SL"
  | "SN" | "ST" | "SH" | "TH";

export const BUNDESLAND_LABEL: Record<Bundesland, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};

export interface Ferienperiode {
  name: string;
  von: string; // YYYY-MM-DD
  bis: string; // YYYY-MM-DD (letzter Ferientag, inklusiv)
}

export const FERIEN: Record<Bundesland, Ferienperiode[]> = {
  BW: [
    { name: "Sommerferien",     von: "2025-07-31", bis: "2025-09-13" },
    { name: "Herbstferien",     von: "2025-10-27", bis: "2025-10-31" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-07" },
    { name: "Osterferien",      von: "2026-04-07", bis: "2026-04-18" },
    { name: "Pfingstferien",    von: "2026-06-02", bis: "2026-06-13" },
    { name: "Sommerferien",     von: "2026-07-30", bis: "2026-09-12" },
    { name: "Herbstferien",     von: "2026-10-26", bis: "2026-10-30" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-09" },
  ],
  BY: [
    { name: "Sommerferien",     von: "2025-07-31", bis: "2025-09-12" },
    { name: "Herbstferien",     von: "2025-10-31", bis: "2025-11-07" },
    { name: "Weihnachtsferien", von: "2025-12-24", bis: "2026-01-05" },
    { name: "Winterferien",     von: "2026-02-16", bis: "2026-02-20" },
    { name: "Osterferien",      von: "2026-04-02", bis: "2026-04-17" },
    { name: "Pfingstferien",    von: "2026-06-09", bis: "2026-06-19" },
    { name: "Sommerferien",     von: "2026-08-03", bis: "2026-09-14" },
    { name: "Herbstferien",     von: "2026-11-02", bis: "2026-11-06" },
    { name: "Weihnachtsferien", von: "2026-12-24", bis: "2027-01-08" },
  ],
  BE: [
    { name: "Sommerferien",     von: "2025-07-17", bis: "2025-08-26" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-02" },
    { name: "Winterferien",     von: "2026-02-02", bis: "2026-02-07" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-10" },
    { name: "Sommerferien",     von: "2026-07-09", bis: "2026-08-22" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-02" },
  ],
  BB: [
    { name: "Sommerferien",     von: "2025-07-17", bis: "2025-08-26" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-02" },
    { name: "Winterferien",     von: "2026-02-02", bis: "2026-02-07" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-11" },
    { name: "Sommerferien",     von: "2026-07-09", bis: "2026-08-22" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-02" },
  ],
  HB: [
    { name: "Sommerferien",     von: "2025-06-26", bis: "2025-08-06" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-06" },
    { name: "Winterferien",     von: "2026-01-26", bis: "2026-01-30" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-10" },
    { name: "Sommerferien",     von: "2026-07-02", bis: "2026-08-12" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-09" },
  ],
  HH: [
    { name: "Sommerferien",     von: "2025-07-17", bis: "2025-08-27" },
    { name: "Herbstferien",     von: "2025-10-13", bis: "2025-10-25" },
    { name: "Weihnachtsferien", von: "2025-12-19", bis: "2026-01-02" },
    { name: "Halbjahrespause",  von: "2026-01-30", bis: "2026-01-30" },
    { name: "Frühjahrsferien",  von: "2026-03-02", bis: "2026-03-13" },
    { name: "Pfingstferien",    von: "2026-05-11", bis: "2026-05-15" },
    { name: "Sommerferien",     von: "2026-07-09", bis: "2026-08-19" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-21", bis: "2027-01-01" },
  ],
  HE: [
    { name: "Sommerferien",     von: "2025-07-14", bis: "2025-08-22" },
    { name: "Herbstferien",     von: "2025-10-13", bis: "2025-10-18" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-09" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-11" },
    { name: "Sommerferien",     von: "2026-06-29", bis: "2026-08-07" },
    { name: "Herbstferien",     von: "2026-10-05", bis: "2026-10-17" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-12" },
  ],
  MV: [
    { name: "Sommerferien",     von: "2025-06-30", bis: "2025-08-09" },
    { name: "Herbstferien",     von: "2025-10-06", bis: "2025-10-18" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-03" },
    { name: "Winterferien",     von: "2026-02-16", bis: "2026-02-28" },
    { name: "Osterferien",      von: "2026-04-02", bis: "2026-04-14" },
    { name: "Sommerferien",     von: "2026-07-13", bis: "2026-08-22" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-21", bis: "2027-01-02" },
  ],
  NI: [
    { name: "Sommerferien",     von: "2025-06-26", bis: "2025-08-06" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-07" },
    { name: "Winterferien",     von: "2026-01-30", bis: "2026-02-04" },
    { name: "Osterferien",      von: "2026-04-06", bis: "2026-04-17" },
    { name: "Sommerferien",     von: "2026-07-02", bis: "2026-08-12" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-09" },
  ],
  NW: [
    { name: "Sommerferien",     von: "2025-07-14", bis: "2025-08-26" },
    { name: "Herbstferien",     von: "2025-10-13", bis: "2025-10-25" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-06" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-11" },
    { name: "Sommerferien",     von: "2026-07-20", bis: "2026-09-01" },
    { name: "Herbstferien",     von: "2026-10-17", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-06" },
  ],
  RP: [
    { name: "Sommerferien",     von: "2025-06-30", bis: "2025-08-08" },
    { name: "Herbstferien",     von: "2025-10-13", bis: "2025-10-24" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-07" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-09" },
    { name: "Sommerferien",     von: "2026-06-29", bis: "2026-08-07" },
    { name: "Herbstferien",     von: "2026-10-17", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-08" },
  ],
  SL: [
    { name: "Sommerferien",     von: "2025-07-14", bis: "2025-08-22" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-05" },
    { name: "Osterferien",      von: "2026-03-30", bis: "2026-04-10" },
    { name: "Sommerferien",     von: "2026-06-29", bis: "2026-08-07" },
    { name: "Herbstferien",     von: "2026-10-17", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-21", bis: "2026-12-31" },
  ],
  SN: [
    { name: "Sommerferien",     von: "2025-07-21", bis: "2025-08-29" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-02" },
    { name: "Winterferien",     von: "2026-02-09", bis: "2026-02-21" },
    { name: "Osterferien",      von: "2026-04-09", bis: "2026-04-18" },
    { name: "Sommerferien",     von: "2026-07-04", bis: "2026-08-14" },
    { name: "Herbstferien",     von: "2026-10-12", bis: "2026-10-24" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-02" },
  ],
  ST: [
    { name: "Sommerferien",     von: "2025-07-21", bis: "2025-08-29" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-03" },
    { name: "Winterferien",     von: "2026-02-09", bis: "2026-02-14" },
    { name: "Osterferien",      von: "2026-04-02", bis: "2026-04-11" },
    { name: "Sommerferien",     von: "2026-07-04", bis: "2026-08-14" },
    { name: "Herbstferien",     von: "2026-10-17", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-21", bis: "2027-01-02" },
  ],
  SH: [
    { name: "Sommerferien",     von: "2025-07-28", bis: "2025-09-06" },
    { name: "Herbstferien",     von: "2025-10-13", bis: "2025-10-25" },
    { name: "Weihnachtsferien", von: "2025-12-19", bis: "2026-01-06" },
    { name: "Winterferien",     von: "2026-01-30", bis: "2026-02-04" },
    { name: "Osterferien",      von: "2026-04-02", bis: "2026-04-16" },
    { name: "Sommerferien",     von: "2026-07-04", bis: "2026-08-15" },
    { name: "Herbstferien",     von: "2026-10-19", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-21", bis: "2027-01-06" },
  ],
  TH: [
    { name: "Sommerferien",     von: "2025-07-21", bis: "2025-08-27" },
    { name: "Herbstferien",     von: "2025-10-20", bis: "2025-11-01" },
    { name: "Weihnachtsferien", von: "2025-12-22", bis: "2026-01-03" },
    { name: "Winterferien",     von: "2026-02-16", bis: "2026-02-21" },
    { name: "Osterferien",      von: "2026-04-01", bis: "2026-04-11" },
    { name: "Sommerferien",     von: "2026-07-04", bis: "2026-08-14" },
    { name: "Herbstferien",     von: "2026-10-17", bis: "2026-10-31" },
    { name: "Weihnachtsferien", von: "2026-12-23", bis: "2027-01-02" },
  ],
};
