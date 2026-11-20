import { formatBrlMillions } from "./money";
import type { CategoryLanding, OverviewKpis } from "./overview.types";

/** View percentages are fractions: 0.055 is displayed as 5.5%. */
export function formatPercent(value: number, withSign = false): string {
  const percent = value * 100;
  const sign = withSign && percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

export function getLargestOverrunCategory(
  rows: Pick<CategoryLanding, "category" | "landing_vs_budget">[],
): string | null {
  const largest = rows.reduce<(typeof rows)[number] | null>(
    (current, row) => (!current || row.landing_vs_budget > current.landing_vs_budget ? row : current),
    null,
  );
  return largest && largest.landing_vs_budget > 0 ? largest.category : null;
}

export function buildLandingSentence(kpis: OverviewKpis): string {
  if (kpis.landing_vs_budget === 0) return `Fiscal year ${kpis.fiscal_year} lands on budget.`;
  const direction = kpis.landing_vs_budget > 0 ? "over" : "under";
  return `Fiscal year ${kpis.fiscal_year} lands ${formatBrlMillions(Math.abs(kpis.landing_vs_budget))} (${formatPercent(Math.abs(kpis.landing_vs_budget_pct))}) ${direction} budget.`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Splits an ISO date ("2026-11-30") without time-zone shifts. */
export function dateParts(iso: string): { day: string; month: string; year: string } {
  const [year = "", month = "1", day = ""] = iso.slice(0, 10).split("-");
  return { day: String(Number(day)), month: MONTHS[Number(month) - 1] ?? "", year };
}

/** "30 Nov 2026" */
export function formatDate(iso: string): string {
  const p = dateParts(iso);
  return `${p.day} ${p.month} ${p.year}`;
}

export function budgetDirection(variance: number): "over" | "under" | "on" {
  return variance > 0 ? "over" : variance < 0 ? "under" : "on";
}
