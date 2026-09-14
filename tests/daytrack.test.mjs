/**
 * Day Mark — logic tests for src/lib/daytrack.ts
 * Run with: npm test
 *
 * Plain-JS tests. They load the TS source as text, strip the type
 * annotations, evaluate it in a sandbox with a mocked Date (today is always
 * Sep 13 2026) and an in-memory localStorage, then assert on behavior.
 */

import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/lib/daytrack.ts", import.meta.url), "utf8");

// ---- Transform TS -> plain JS ----
let js = source
  .replace(/^\s*\/\/.*$/gm, "")
  .replace(/export interface [\s\S]*?\n\}/g, "")
  .replace(/interface [\s\S]*?\n\}/g, "")
  .replace(/export /g, "")
  .replace(/type \w+ = [^;]+;/g, "")
  .replace(/ as \w+/g, "")
  .replace(/function (\w+)\(([^)]*)\)(:\s*[^{]+)?\{/g, (m, name, params) => {
    const cleanParams = params
      .split(",")
      .map((p) => p.trim().split(/[:=]/)[0].trim())
      .filter(Boolean)
      .join(", ");
    return `function ${name}(${cleanParams}) {`;
  })
  .replace(/(\w+)\s*=\s*\(([^)]*)\)\s*(:[^=]+)?=>/g, (m, name, params) => {
    const cleanParams = params
      .split(",")
      .map((p) => p.trim().split(/[:=]/)[0].trim())
      .filter(Boolean)
      .join(", ");
    return `${name} = (${cleanParams}) =>`;
  })
  .replace(/(const|let) (\w+)\s*:\s*[^=\n]+/g, "$1 $2");

// Sanity: the transform must produce parseable JS
try {
  new Function(js);
} catch (err) {
  console.error("Transform produced invalid JS:", err.message);
  process.exit(1);
}

const EXPORT_NAMES = [
  "dateKeyFromDate",
  "dateKeyFromParts",
  "parseDateKey",
  "getCalendarDays",
  "getMonthStats",
  "getStreaks",
  "getRecentHistory",
  "loadData",
  "saveData",
  "getDayStatus",
  "setDayStatus",
  "setDayNote",
  "clearDayStatus",
  "exportData",
  "importData",
];

// ---- Mock Date: today is always Sep 13 2026 (local), noon ----
const RealDate = Date;
const MOCK = new RealDate(2026, 8, 13, 12, 0, 0);
class MockDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(MOCK.getTime());
    } else {
      super(...args);
    }
  }
  static now() {
    return MOCK.getTime();
  }
}

// ---- In-memory localStorage ----
const store = new Map();
const localStorageMock = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// ---- Sandbox ----
const sandbox = {
  console,
  JSON,
  Math,
  Object,
  Date: MockDate,
  String,
  Number,
  localStorage: localStorageMock,
  __exports: {},
};
vm.createContext(sandbox);

const collector = EXPORT_NAMES.map(
  (n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== "undefined" ? ${n} : null;`,
).join("\n");

let lib;
try {
  vm.runInContext(js + "\n" + collector, sandbox, { filename: "daytrack.ts" });
  lib = sandbox.__exports;
} catch (err) {
  console.error("Failed to evaluate daytrack.ts:", err.message);
  process.exit(1);
}

const missing = EXPORT_NAMES.filter((n) => typeof lib[n] !== "function");
if (missing.length) {
  console.error("Missing exports after evaluation:", missing.join(", "));
  process.exit(1);
}

const {
  dateKeyFromDate,
  dateKeyFromParts,
  parseDateKey,
  getCalendarDays,
  getMonthStats,
  getStreaks,
  getRecentHistory,
  loadData,
  saveData,
  setDayStatus,
  setDayNote,
  clearDayStatus,
  exportData,
  importData,
} = lib;

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}`);
  }
}

function assertEq(actual, expected, name) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}\n        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`);
  }
}

// ==================== Date key helpers ====================
console.log("\n[date helpers]");
assertEq(dateKeyFromDate(new Date(2026, 8, 13)), "2026-09-13", "dateKeyFromDate formats correctly");
assertEq(dateKeyFromParts(2026, 8, 1), "2026-09-01", "dateKeyFromParts pads month/day");
assertEq(dateKeyFromParts(2026, 0, 5), "2026-01-05", "dateKeyFromParts January");
const parsed = parseDateKey("2026-09-13");
assert(parsed && parsed.getFullYear() === 2026 && parsed.getMonth() === 8 && parsed.getDate() === 13, "parseDateKey round-trips");
assertEq(parseDateKey("garbage"), null, "parseDateKey rejects garbage");

// ==================== Calendar generation ====================
console.log("\n[calendar]");
const sepDays = getCalendarDays(2026, 8); // September 2026
assertEq(sepDays.length, 42, "calendar always has 42 cells");
assertEq(sepDays[0].dayOfMonth, 31, "grid starts on the Monday before the 1st (Aug 31)");
assertEq(sepDays[0].isCurrentMonth, false, "leading days are outside the month");
assert(sepDays.some((d) => d.dayOfMonth === 1 && d.isCurrentMonth), "contains September 1");
assertEq(sepDays.filter((d) => d.isCurrentMonth).length, 30, "30 days in September");
const todayCell = sepDays.find((d) => d.isToday);
assert(todayCell && todayCell.dayOfMonth === 13, "today (Sep 13) is flagged");
const futureCell = sepDays.find((d) => d.dayOfMonth === 20);
assert(futureCell && futureCell.isFuture === true, "Sep 20 flagged as future");
const pastCell = sepDays.find((d) => d.dayOfMonth === 10);
assert(pastCell && pastCell.isFuture === false, "Sep 10 not future");

// ==================== Status storage ====================
console.log("\n[storage]");
let data = {};
data = setDayStatus(data, "2026-09-13", "good");
assertEq(data["2026-09-13"].status, "good", "setDayStatus marks good");
data = setDayStatus(data, "2026-09-12", "wasted");
assertEq(data["2026-09-12"].status, "wasted", "setDayStatus marks wasted");
data = setDayStatus(data, "2026-09-13", "wasted");
assertEq(data["2026-09-13"].status, "wasted", "today can be changed multiple times");
data = setDayStatus(data, "2026-09-13", "good");
assertEq(data["2026-09-13"].status, "good", "and changed back again");
data = setDayNote(data, "2026-09-13", "Finished the chapter");
assertEq(data["2026-09-13"].note, "Finished the chapter", "setDayNote saves the note");
assertEq(data["2026-09-13"].status, "good", "setDayNote preserves existing status");
data = clearDayStatus(data, "2026-09-12");
assertEq(data["2026-09-12"], undefined, "clearDayStatus removes the day");
assert(data["2026-09-13"], "other days survive a clear");

saveData(data);
const reloaded = loadData();
assertEq(reloaded["2026-09-13"].status, "good", "data persists through localStorage");

const json = exportData(data);
const roundTripped = importData(json);
assertEq(Object.keys(roundTripped).length, Object.keys(data).length, "export/import preserves all days");
let threw = false;
try {
  importData("not json at all");
} catch {
  threw = true;
}
assert(threw, "importData rejects invalid JSON");

// ==================== Monthly stats ====================
console.log("\n[month stats]");
let statsData = {};
for (let d = 1; d <= 10; d++) statsData = setDayStatus(statsData, dateKeyFromParts(2026, 8, d), "good");
statsData = setDayStatus(statsData, "2026-09-11", "wasted");
statsData = setDayStatus(statsData, "2026-09-12", "wasted");
statsData = setDayStatus(statsData, "2026-09-20", "good"); // future day — must NOT count

const sepStats = getMonthStats(statsData, 2026, 8);
assertEq(sepStats.goodDays, 10, "counts 10 good days (future ignored)");
assertEq(sepStats.wastedDays, 2, "counts 2 wasted days");
assertEq(sepStats.unmarkedDays, 1, "counts only past unmarked days");
assertEq(sepStats.goodPercentage, 83.3, "good rate excludes unmarked days (10/12 = 83.3%)");

const emptyStats = getMonthStats({}, 2026, 8);
assertEq(emptyStats.goodPercentage, 0, "empty month has 0% rate without dividing by zero");
assertEq(emptyStats.unmarkedDays, 13, "empty month counts 13 past unmarked days");

// ==================== Streaks ====================
console.log("\n[streaks]");
let streakData = {};
for (let d = 8; d <= 12; d++) streakData = setDayStatus(streakData, dateKeyFromParts(2026, 8, d), "good");
let s = getStreaks(streakData);
assertEq(s.current, 5, "current streak counts back from yesterday when today is unmarked");

streakData = setDayStatus(streakData, "2026-09-13", "good");
s = getStreaks(streakData);
assertEq(s.current, 6, "marking today good extends the streak");

streakData = setDayStatus(streakData, "2026-09-13", "wasted");
s = getStreaks(streakData);
assertEq(s.current, 0, "a wasted today breaks the current streak");

let bestData = {};
for (let d = 1; d <= 3; d++) bestData = setDayStatus(bestData, dateKeyFromParts(2026, 8, d), "good");
for (let d = 8; d <= 12; d++) bestData = setDayStatus(bestData, dateKeyFromParts(2026, 8, d), "good");
s = getStreaks(bestData);
assertEq(s.best, 5, "best streak finds the longest run (5)");
assert(s.best < 9, "unmarked days do not join runs across the gap");

let brokenData = {};
for (let d = 1; d <= 3; d++) brokenData = setDayStatus(brokenData, dateKeyFromParts(2026, 8, d), "good");
brokenData = setDayStatus(brokenData, "2026-09-04", "wasted");
for (let d = 5; d <= 8; d++) brokenData = setDayStatus(brokenData, dateKeyFromParts(2026, 8, d), "good");
s = getStreaks(brokenData);
assertEq(s.best, 4, "a wasted day splits best streak runs (4 not 8)");

// ==================== History ====================
console.log("\n[history]");
let histData = {};
histData = setDayStatus(histData, "2026-09-13", "good");
histData = setDayNote(histData, "2026-09-13", "ran 5k");
histData = setDayStatus(histData, "2026-09-12", "wasted");
const hist = getRecentHistory(histData, 7);
assertEq(hist.length, 7, "history returns requested count");
assertEq(hist[0].dateKey, "2026-09-13", "history starts with today");
assertEq(hist[0].status, "good", "history has today's status");
assertEq(hist[0].note, "ran 5k", "history includes notes");
assertEq(hist[1].status, "wasted", "history includes yesterday");
assertEq(hist[2].status, null, "unmarked days appear as null, not wasted");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
