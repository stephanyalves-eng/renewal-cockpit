/** KPI format, e.g. "BRL 18.5M". */
export function formatBrlCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}BRL ${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}BRL ${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}BRL ${(abs / 1e3).toFixed(1)}K`;
  return `${sign}BRL ${Math.round(abs)}`;
}

/** Narrative variance format, e.g. "BRL 0.97M". */
export function formatBrlMillions(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}BRL ${(Math.abs(value) / 1e6).toFixed(2)}M`;
}

/** Table format, e.g. "BRL 1,234,567". */
export function formatBrlFull(value: number): string {
  return `BRL ${Math.round(value).toLocaleString("en-US")}`;
}

/** Executive KPI format: millions with two decimals ("BRL 18.51M"), otherwise compact ("BRL 910.6K"). */
export function formatBrlKpi(value: number): string {
  if (Math.abs(value) >= 1e6 && Math.abs(value) < 1e9) {
    return `${value < 0 ? "-" : ""}BRL ${(Math.abs(value) / 1e6).toFixed(2)}M`;
  }
  return formatBrlCompact(value);
}

/** Totals with cents, e.g. "BRL 1,042,321.80". */
export function formatBrlCents(value: number): string {
  return `BRL ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
