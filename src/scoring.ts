/**
 * Plausibility check for submitted scores.
 *
 * The server cannot see everything the engine measured (CPU clock, populated RAM slots,
 * integrated vs discrete GPU), so it computes an UPPER BOUND: every unknown input gets
 * its best possible value. A submitted score above that bound (plus tolerance) cannot
 * have come from the hardware described in the payload; such submissions are still
 * counted in the aggregates but kept off the public leaderboard.
 *
 * The rules mirror score.rs in the OmaRank engine; an unknown GPU yields no limit.
 */

import { WEIGHTS } from "./tiers";

export const PLAUSIBILITY_TOLERANCE = 5;

export interface ScoreInputs {
  cpuCores: number;
  cpuThreads: number;
  gpuModel: string;
  ramGb: number;
  ramType: string;
  ramSpeed: number;
  chipset: string;
  display: string;
  displayCount: number;
  storageType: string;
}

function cpuMax(cores: number, threads: number): number {
  if (threads <= 0) return 100;
  let s = 15;
  if (threads >= 32) s += 65;
  else if (threads >= 24) s += 58;
  else if (threads >= 20) s += 54;
  else if (threads >= 16) s += 46;
  else if (threads >= 12) s += 38;
  else if (threads >= 8) s += 28;
  else if (threads >= 4) s += 16;
  if (cores >= 16) s += 10;
  else if (cores >= 12) s += 8;
  else if (cores >= 8) s += 6;
  s += 12; // clock is not reported: assume the best bonus
  return Math.min(100, s);
}

function ramMax(gb: number, type: string, speed: number): number {
  if (gb <= 0) return 100;
  let s: number;
  if (gb >= 120) s = 80;
  else if (gb >= 60) s = 74;
  else if (gb >= 30) s = 62;
  else if (gb >= 15) s = 46;
  else if (gb >= 11) s = 32;
  else if (gb >= 7) s = 20;
  else if (gb >= 3.5) s = 10;
  else s = 4;
  const t = type.toUpperCase();
  if (t.includes("DDR5")) s += 10;
  else if (t.includes("DDR4")) s += 6;
  else if (t.includes("DDR3")) s += 0;
  else if (t.includes("DDR2")) s -= 6;
  else s += 10; // unknown type: assume best
  if (speed <= 0 || speed >= 6400) s += 10;
  else if (speed >= 5600) s += 8;
  else if (speed >= 4800) s += 6;
  else if (speed >= 3600) s += 5;
  else if (speed >= 3200) s += 4;
  else if (speed >= 2666) s += 2;
  else if (speed >= 2133) s += 1;
  s += 10; // populated slots are not reported
  return Math.min(100, s);
}

// Ordered like score_gpu() in the engine: first match wins.
const GPU_TABLE: [string[], number][] = [
  [["5090"], 100],
  [["5080", "4090"], 99],
  [["5070 ti", "4080 super", "4080", "7900 xtx"], 95],
  [["5070", "4070 ti super", "4070 ti", "7900 xt", "8800 xt", "9070 xt"], 90],
  [["4070 super", "4070", "7800 xt", "3090", "6950", "9070"], 86],
  [["b580", "battlemage", "5060 ti", "4060 ti", "7700 xt", "3080"], 82],
  [["b570", "5060", "9060 xt", "4060", "3070", "7600 xt"], 76],
  [["a770", "a750", "3060", "6600", "2070"], 68],
  [["3050", "2060", "1660", "rx 580", "rx 570"], 50],
  [["1060", "1050", "gtx 970"], 40],
];

function gpuMax(model: string): number {
  const n = model.toLowerCase();
  for (const [needles, score] of GPU_TABLE) {
    if (needles.some((x) => n.includes(x))) return score;
  }
  return 100; // unknown or integrated naming: no constraint
}

function displayMax(display: string, count: number): number {
  const m = display.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})\s*@\s*(\d+(?:\.\d+)?)/);
  if (!m) return 100;
  const pixels = Number(m[1]) * Number(m[2]);
  const hz = Number(m[3]);
  let s = 30;
  if (pixels >= 7_000_000) s += 42;
  else if (pixels >= 3_600_000) s += 32;
  else if (pixels >= 2_000_000) s += 18;
  else s += 8;
  if (hz >= 239) s += 26;
  else if (hz >= 165) s += 20;
  else if (hz >= 143) s += 16;
  else if (hz >= 119) s += 12;
  else if (hz >= 74) s += 6;
  // Only the primary display is reported; a second screen could be better.
  // Assume the best possible secondary display plus the multi-monitor bonus.
  if (count > 1) s = 98 + (count - 1) * 4;
  return Math.min(100, s);
}

function moboMax(chipset: string): number {
  const c = chipset.toUpperCase();
  let s = 70;
  if (["Z890", "Z790", "X870E", "X670E", "TRX40", "WRX80"].some((x) => c.includes(x))) s = 94;
  else if (
    ["B850", "X870", "B760", "B650E", "B650", "Z690", "X570", "Z590", "ARROW LAKE", "LUNAR LAKE", "METEOR LAKE", "STRIX POINT"].some((x) =>
      c.includes(x)
    )
  )
    s = 86;
  else if (
    ["B660", "B550", "B450", "H670", "H770", "A620", "RAPTOR LAKE", "ALDER LAKE", "HAWK POINT", "PHOENIX"].some((x) => c.includes(x))
  )
    s = 78;
  else if (["H610", "H510", "A520", "A320", "H410", "H310"].some((x) => c.includes(x))) s = 62;
  else if (["H81", "H61", "B75", "G41"].some((x) => c.includes(x))) s = 45;
  else if (!c || c.includes("MAINSTREAM")) s = 94; // chipset unknown
  // The board-line bonus is a name heuristic: always allow the best (+5)
  return Math.min(100, s + 5);
}

function storageMax(type: string): number {
  const t = type.toLowerCase();
  return t.includes("hdd") || t.includes("hard disk") ? 32 : 96;
}

/** Highest total OmaScore the described hardware could produce. */
export function maxPlausibleScore(i: ScoreInputs): number {
  const total =
    cpuMax(i.cpuCores, i.cpuThreads) * WEIGHTS.cpu +
    gpuMax(i.gpuModel) * WEIGHTS.gpu +
    ramMax(i.ramGb, i.ramType, i.ramSpeed) * WEIGHTS.ram +
    moboMax(i.chipset) * WEIGHTS.mobo +
    displayMax(i.display, i.displayCount) * WEIGHTS.display +
    storageMax(i.storageType) * WEIGHTS.storage;
  return Math.min(100, Math.round(total / 100));
}
