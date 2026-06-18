import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function formatGroupedDecimal(
  sign: string,
  whole: string,
  decimalWithDot = "",
): string {
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${groupedWhole}${decimalWithDot}`;
}

/** Trailing float junk like .60000000003 or .19999999997 */
function hasRepetitiveDecimalTail(value: number | string): boolean {
  const raw =
    typeof value === "string"
      ? value.trim().replace(/,/g, "")
      : value.toString();
  return /\.\d*0{4,}\d$/.test(raw) || /\.\d*9{4,}\d$/.test(raw);
}

function formatPlainNumber(num: number): string {
  if (!Number.isFinite(num)) return "";
  if (Object.is(num, -0)) return "0";
  if (Number.isInteger(num)) return String(num);

  if (hasRepetitiveDecimalTail(num)) {
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  const raw = num.toString();
  if (raw.includes("e") || raw.includes("E")) {
    return num.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 12,
    });
  }

  return raw;
}

/**
 * Whole numbers stay whole (10).
 * Real decimals stay exact (10.602569).
 * Repetitive float noise is trimmed to cents (349998.60000000003 → 349998.60).
 */
export function formatExactNumber(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string") {
    const trimmed = value.trim().replace(/,/g, "");
    if (!trimmed) return "";

    if (hasRepetitiveDecimalTail(trimmed)) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return formatExactNumber(parsed);
      }
    }

    const match = trimmed.match(/^([+-]?)(\d+)(\.\d+)?$/);
    if (!match) return trimmed;

    const [, sign, whole, decimal = ""] = match;
    return formatGroupedDecimal(sign, whole, decimal);
  }

  if (!Number.isFinite(value)) return "";

  const plain = formatPlainNumber(value);
  const match = plain.match(/^([+-]?)(\d+)(\.\d+)?$/);
  if (!match) return plain;

  const [, sign, whole, decimal = ""] = match;
  return formatGroupedDecimal(sign, whole, decimal);
}

function formatPlainStringWithGrouping(plain: string): string {
  const match = plain.match(/^([+-]?)(\d+)(\.\d+)?$/);
  if (!match) return plain;
  const [, sign, whole, decimal = ""] = match;
  return formatGroupedDecimal(sign, whole, decimal);
}

function countDecimalPlacesInInput(value: number | string): number {
  if (typeof value === "string") {
    const trimmed = value.trim().replace(/,/g, "");
    const match = trimmed.match(/\.(\d+)$/);
    return match ? match[1].length : 0;
  }
  return countDecimalPlaces(value);
}

/**
 * Format price × quantity totals using the operands' decimal precision.
 * e.g. 1666.66 × 210 → 349,998.60 (not 349,998.6)
 */
export function formatMultipliedTotal(
  total: number | string | null | undefined,
  price: number | string,
  quantity: number | string,
): string {
  if (total === null || total === undefined || total === "") return "";

  const num =
    typeof total === "string" ? parseMoneyInput(total) : total;
  if (!Number.isFinite(num)) return "";

  const cleaned = normalizeCalculatedDecimal(num);

  if (hasRepetitiveDecimalTail(cleaned)) {
    return formatPlainStringWithGrouping(
      (Math.round(cleaned * 100) / 100).toFixed(2),
    );
  }

  const displayDecimals = Math.min(
    countDecimalPlacesInInput(price) + countDecimalPlacesInInput(quantity),
    MAX_DISPLAY_DECIMALS,
  );

  if (displayDecimals > 0) {
    const factor = 10 ** displayDecimals;
    const rounded = Math.round(cleaned * factor) / factor;

    if (Number.isInteger(rounded)) {
      return String(rounded);
    }

    return formatPlainStringWithGrouping(rounded.toFixed(displayDecimals));
  }

  return formatExactNumber(cleaned);
}

/** Format a unit price using its own decimal precision (e.g. 1666.66 stays 1666.66). */
export function formatUnitPrice(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "";
  return formatMultipliedTotal(value, value, 1);
}

/** Format a summed invoice total using line-item decimal precision. */
export function formatAggregatedTotal(
  total: number | string | null | undefined,
  items: { price: number | string; quantity: number | string }[],
): string {
  if (total === null || total === undefined || total === "") return "";

  const num =
    typeof total === "string" ? parseMoneyInput(total) : total;
  if (!Number.isFinite(num)) return "";

  const cleaned = normalizeCalculatedDecimal(num);

  if (hasRepetitiveDecimalTail(cleaned)) {
    return formatPlainStringWithGrouping(
      (Math.round(cleaned * 100) / 100).toFixed(2),
    );
  }

  const displayDecimals = Math.min(
    Math.max(
      0,
      ...items.map(
        (it) =>
          countDecimalPlacesInInput(it.price) +
          countDecimalPlacesInInput(it.quantity),
      ),
    ),
    MAX_DISPLAY_DECIMALS,
  );

  if (displayDecimals > 0) {
    const factor = 10 ** displayDecimals;
    const rounded = Math.round(cleaned * factor) / factor;

    if (Number.isInteger(rounded)) {
      return String(rounded);
    }

    return formatPlainStringWithGrouping(rounded.toFixed(displayDecimals));
  }

  return formatExactNumber(cleaned);
}

/** Same rules as formatExactNumber. */
export function formatMoney(
  value: number | string | null | undefined,
): string {
  return formatExactNumber(value);
}

export function parseMoneyInput(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
}

/** Remove repetitive float noise from calculated values before storing. */
export function normalizeCalculatedDecimal(num: number): number {
  if (!Number.isFinite(num)) return 0;
  if (hasRepetitiveDecimalTail(num)) {
    return Math.round(num * 100) / 100;
  }
  return num;
}

const MAX_DISPLAY_DECIMALS = 12;

function countDecimalPlaces(num: number): number {
  if (!Number.isFinite(num) || Number.isInteger(num)) return 0;
  const raw = num.toString();
  if (raw.includes("e") || raw.includes("E")) return 2;
  if (hasRepetitiveDecimalTail(raw)) return 2;
  const fraction = raw.split(".")[1];
  return fraction?.length ?? 0;
}

/** Multiply without leaving repetitive float tails on the result. */
export function multiplyDecimalValues(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;

  const cleanA = normalizeCalculatedDecimal(a);
  const cleanB = normalizeCalculatedDecimal(b);

  const decimalPlaces = Math.min(
    countDecimalPlaces(cleanA) + countDecimalPlaces(cleanB),
    MAX_DISPLAY_DECIMALS,
  );

  if (decimalPlaces === 0) {
    return Math.round(cleanA * cleanB);
  }

  const factor = 10 ** decimalPlaces;
  return normalizeCalculatedDecimal(Math.round(cleanA * cleanB * factor) / factor);
}

const documentNumberCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function compareDocumentNumberDesc(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): number {
  return documentNumberCollator.compare(String(b ?? ""), String(a ?? ""));
}

/** Convert number to words for USD amounts (e.g. for invoices). */
export function amountInWords(n: number): string {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  if (!Number.isFinite(n)) return "ZERO";
  if (n < 0 || n >= 1e9) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  function upTo99(x: number): string {
    if (x < 10) return ones[x];
    if (x < 20) return teens[x - 10];
    const t = Math.floor(x / 10);
    const o = x % 10;
    return tens[t] + (o ? " " + ones[o] : "");
  }
  function upTo999(x: number): string {
    if (x < 100) return upTo99(x);
    const h = Math.floor(x / 100);
    const r = x % 100;
    return ones[h] + " HUNDRED" + (r ? " " + upTo99(r) : "");
  }
  function upTo999999(x: number): string {
    if (x < 1000) return upTo999(x);
    const th = Math.floor(x / 1000);
    const r = x % 1000;
    return upTo999(th) + " THOUSAND" + (r ? " " + upTo999(r) : "");
  }
  function upTo999999999(x: number): string {
    if (x < 1e6) return upTo999999(x);
    const m = Math.floor(x / 1e6);
    const r = x % 1e6;
    return upTo999(m) + " MILLION" + (r ? " " + upTo999999(r) : "");
  }

  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);

  const wholeWords = whole === 0 ? "ZERO" : upTo999999999(whole);
  if (cents === 0) return wholeWords;

  const centsWords = upTo99(cents);
  return `${wholeWords} AND ${centsWords} CENTS`;
}
