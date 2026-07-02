import { parse, isValid, format } from "date-fns";
import { es } from "date-fns/locale";
import type { Locale } from "date-fns";

/** Same split/strip/filter logic as contentItemCopySchema's hashtags transform. */
export function parseHashtags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((h) => h.replace(/^#/, "").trim())
    .filter(Boolean);
}

/** Trim + lowercase, for case-insensitive matching (titles, taxonomy names, assignee names). */
export function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Matches rawCsvValue against enum keys directly, then against the label
 * map's values, both case-insensitively. Returns null if nothing matches
 * (caller falls back to the column's own DB default + a warning).
 */
export function resolveEnumValue<T extends string>(
  rawCsvValue: string | undefined,
  enumValues: readonly T[],
  labelMap: Record<T, string>,
): T | null {
  if (!rawCsvValue?.trim()) return null;
  const norm = normalizeKey(rawCsvValue);
  const byKey = enumValues.find((v) => v.toLowerCase() === norm);
  if (byKey) return byKey;
  const byLabel = enumValues.find((v) => labelMap[v].toLowerCase() === norm);
  return byLabel ?? null;
}

// Locale only matters for formats with a month *name* (MMMM) — numeric
// formats parse identically regardless. "MMMM d, yyyy" targets English month
// names (the default date-fns locale), the "de"-literal format targets
// Spanish month names explicitly — mixing them up silently fails valid dates.
const DATE_FORMATS: { fmt: string; locale?: Locale }[] = [
  { fmt: "yyyy-MM-dd" },
  { fmt: "dd/MM/yyyy" },
  { fmt: "MM/dd/yyyy" },
  { fmt: "d/M/yyyy" },
  { fmt: "MMMM d, yyyy" },
  { fmt: "d 'de' MMMM 'de' yyyy", locale: es },
];

/** Lenient date parser: tries a short list of common formats, returns 'yyyy-MM-dd' or null. */
export function parseLenientDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  for (const { fmt, locale } of DATE_FORMATS) {
    const parsed = parse(trimmed, fmt, new Date(), locale ? { locale } : undefined);
    if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  }
  return null;
}

const TIME_FORMATS = ["HH:mm", "HH:mm:ss", "h:mm a"];

/** hora_sugerida: tries a short list of common time formats, returns 'HH:mm' or null. */
export function parseLenientTime(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  for (const fmt of TIME_FORMATS) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) return format(parsed, "HH:mm");
  }
  return null;
}

/** Coerces a CSV numeric string (possibly with thousand separators) to a non-negative integer, defaulting to 0 rather than failing the row. */
export function parseCount(raw: string | undefined): number {
  if (!raw?.trim()) return 0;
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  const n = Number(digitsOnly);
  return Number.isFinite(n) ? n : 0;
}
