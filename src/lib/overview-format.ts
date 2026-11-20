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
