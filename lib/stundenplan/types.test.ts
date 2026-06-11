import { describe, it, expect } from "vitest";
import {
  wochentagAusDatum,
  filterStunden,
  pausenZwischen,
  hexToRgba,
  fmtZeit,
  type StundeRow,
} from "./types";

const stunde = (o: Partial<StundeRow> = {}): StundeRow => ({
  id: "x",
  user_id: "u",
  fach_id: null,
  wochentag: 1,
  zeit_start: "08:00:00",
  zeit_end:   "09:30:00",
  raum: null,
  woche_typ: null,
  ...o,
});

describe("wochentagAusDatum", () => {
  // 2026-06: Mo=1, Tu=2, We=3, Th=4, Fr=5, Sa=6, Su=7
  it("Mo → 1", () => expect(wochentagAusDatum("2026-06-01")).toBe(1));
  it("Di → 2", () => expect(wochentagAusDatum("2026-06-02")).toBe(2));
  it("Mi → 3", () => expect(wochentagAusDatum("2026-06-03")).toBe(3));
  it("So → 7", () => expect(wochentagAusDatum("2026-06-07")).toBe(7));
  it("Sa → 6", () => expect(wochentagAusDatum("2026-06-06")).toBe(6));
});

describe("filterStunden", () => {
  const s = [
    stunde({ woche_typ: null }),
    stunde({ woche_typ: "A" }),
    stunde({ woche_typ: "B" }),
  ];
  it("standard: nur null-Typ", () =>
    expect(filterStunden(s, "standard", "A")).toHaveLength(1));
  it("AB Woche A: null + A", () =>
    expect(filterStunden(s, "AB", "A")).toHaveLength(2));
  it("AB Woche B: null + B", () =>
    expect(filterStunden(s, "AB", "B")).toHaveLength(2));
});

describe("pausenZwischen", () => {
  it("erkennt 15-min-Pause", () => {
    const s = [
      stunde({ zeit_start: "08:00:00", zeit_end: "09:30:00" }),
      stunde({ zeit_start: "09:45:00", zeit_end: "11:15:00" }),
    ];
    expect(pausenZwischen(s)).toEqual([
      { start: "09:30:00", end: "09:45:00", minuten: 15 },
    ]);
  });
  it("keine Pause wenn direkt anschließend", () => {
    const s = [
      stunde({ zeit_start: "08:00:00", zeit_end: "09:30:00" }),
      stunde({ zeit_start: "09:30:00", zeit_end: "11:00:00" }),
    ];
    expect(pausenZwischen(s)).toHaveLength(0);
  });
  it("leeres Array für eine Stunde", () =>
    expect(pausenZwischen([stunde()])).toHaveLength(0));
});

describe("hexToRgba", () => {
  it("konvertiert Hex zu rgba-String", () =>
    expect(hexToRgba("#1da1ff", 0.15)).toBe("rgba(29,161,255,0.15)"));
});

describe("fmtZeit", () => {
  it("kürzt HH:MM:SS auf HH:MM", () =>
    expect(fmtZeit("09:30:00")).toBe("09:30"));
  it("lässt HH:MM unverändert", () =>
    expect(fmtZeit("09:30")).toBe("09:30"));
});
