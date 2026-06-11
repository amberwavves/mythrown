import fs from "fs";
import path from "path";

export interface ThrownSettings {
  rows: [string, string, string];
  rowGap: string;
  rowWidths: [string, string, string];
  rowOffsets: [string, string, string];
  lineHeight: string;
  letterSpacing: string;
  rowSpacings: [string, string, string];
}

const SETTINGS_FILE = path.resolve("./public/thrown-settings.json");

const DEFAULT_SETTINGS: ThrownSettings = {
  rows: ["TH", "RO", "WN"],
  rowGap: "0.75rem",
  rowWidths: ["14.2ch", "13.5ch", "13.5ch"],
  rowOffsets: ["0px", "0px", "0px"],
  lineHeight: "0.78",
  letterSpacing: "-0.185em",
  rowSpacings: ["-0.185em", "-0.185em", "-0.185em"],
};

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeRows(value: unknown): [string, string, string] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.rows;
  return [
    normalizeString(value[0], DEFAULT_SETTINGS.rows[0]),
    normalizeString(value[1], DEFAULT_SETTINGS.rows[1]),
    normalizeString(value[2], DEFAULT_SETTINGS.rows[2]),
  ];
}

function normalizeRowWidths(value: unknown): [string, string, string] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.rowWidths;
  return [
    normalizeString(value[0], DEFAULT_SETTINGS.rowWidths[0]),
    normalizeString(value[1], DEFAULT_SETTINGS.rowWidths[1]),
    normalizeString(value[2], DEFAULT_SETTINGS.rowWidths[2]),
  ];
}

function normalizeRowSpacings(value: unknown): [string, string, string] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.rowSpacings;
  return [
    normalizeString(value[0], DEFAULT_SETTINGS.rowSpacings[0]),
    normalizeString(value[1], DEFAULT_SETTINGS.rowSpacings[1]),
    normalizeString(value[2], DEFAULT_SETTINGS.rowSpacings[2]),
  ];
}

function normalizeRowOffsets(value: unknown): [string, string, string] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.rowOffsets;
  return [
    normalizeString(value[0], DEFAULT_SETTINGS.rowOffsets[0]),
    normalizeString(value[1], DEFAULT_SETTINGS.rowOffsets[1]),
    normalizeString(value[2], DEFAULT_SETTINGS.rowOffsets[2]),
  ];
}

function normalizeSettings(data: unknown): ThrownSettings {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      rows: normalizeRows((data as any).rows),
      rowGap: normalizeString((data as any).rowGap, DEFAULT_SETTINGS.rowGap),
      rowWidths: normalizeRowWidths((data as any).rowWidths),
      rowOffsets: normalizeRowOffsets((data as any).rowOffsets),
      lineHeight: normalizeString((data as any).lineHeight, DEFAULT_SETTINGS.lineHeight),
      letterSpacing: normalizeString((data as any).letterSpacing, DEFAULT_SETTINGS.letterSpacing),
      rowSpacings: normalizeRowSpacings((data as any).rowSpacings),
    };
  }
  return DEFAULT_SETTINGS;
}

export function loadThrownSettings(): ThrownSettings {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveThrownSettings(settings: ThrownSettings): ThrownSettings {
  const normalized = normalizeSettings(settings);
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}
