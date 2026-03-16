import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert number to words for USD amounts (e.g. for invoices). */
export function amountInWords(n: number): string {
  const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
  const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const whole = Math.round(n);
  if (whole === 0) return "ZERO";
  if (whole < 0 || whole >= 1e9) return whole.toLocaleString();

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
  return upTo999999999(whole);
}
