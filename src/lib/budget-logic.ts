import type { TrendRow, WaterfallRow, WaterfallScope } from "./budget.types";

/**
 * Display helpers for the Budget vs. actual page. They only filter and add up rows that the
 * database views already calculated; no business rule lives here.
 */

type Filterable = { category: string; owner_department: string };

/** Empty selection means "All". */
export function filterRows<T extends Filterable>(rows: T[], categories: string[], departments: string[]): T[] {
  return rows.filter(
    (r) =>
      (categories.length === 0 || categories.includes(r.category)) &&
      (departments.length === 0 || departments.includes(r.owner_department)),
  );
}

export function optionsOf<T extends Filterable>(rows: T[], key: keyof Filterable): string[] {
  return [...new Set(rows.map((r) => r[key]))].sort();
}

export type MonthPoint = {
  month: string;
  actual: number | null;
  budget: number | null;
  forecast: number | null;
  /** Forecast for drawing: also set on the last actual month so the dashed line starts there. */
  forecastLine: number | null;
};

function addNullable(a: number | null, b: number | null): number | null {
  if (b === null) return a;
  return (a ?? 0) + b;
}

export function monthlySeries(rows: TrendRow[]): MonthPoint[] {
  const byMonth = new Map<string, MonthPoint>();
  for (const r of rows) {
    const p = byMonth.get(r.month) ?? { month: r.month, actual: null, budget: null, forecast: null, forecastLine: null };
    p.actual = addNullable(p.actual, r.actual);
    p.budget = addNullable(p.budget, r.budget);
    p.forecast = addNullable(p.forecast, r.forecast);
    byMonth.set(r.month, p);
  }
  const points = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
  const last = lastActualMonth(points);
  for (const p of points) p.forecastLine = p.month === last ? p.actual : p.forecast;
  return points;
}

export function lastActualMonth(points: Pick<MonthPoint, "month" | "actual">[]): string | null {
  const withActual = points.filter((p) => p.actual !== null);
  return withActual.length ? withActual[withActual.length - 1]!.month : null;
}

export type WaterfallStep = {
  step: "Budget" | "Price" | "Volume" | "Unbudgeted" | "Landing";
  amount: number;
  /** Bar spans from `from` to `to`; totals start at zero. */
  from: number;
  to: number;
  kind: "total" | "change";
};

export function waterfallSteps(rows: WaterfallRow[], scope: WaterfallScope): WaterfallStep[] {
  const r = rows.filter((x) => x.scope === scope);
  const sum = (k: "budget" | "price" | "volume" | "unbudgeted" | "landing") =>
    Math.round(r.reduce((s, x) => s + x[k], 0) * 100) / 100;
  const budget = sum("budget");
  const changes = [
    ["Price", sum("price")],
    ["Volume", sum("volume")],
    ["Unbudgeted", sum("unbudgeted")],
  ] as const;
  const steps: WaterfallStep[] = [{ step: "Budget", amount: budget, from: 0, to: budget, kind: "total" }];
  let running = budget;
  for (const [step, amount] of changes) {
    const next = Math.round((running + amount) * 100) / 100;
    steps.push({ step, amount, from: running, to: next, kind: "change" });
    running = next;
  }
  const landing = sum("landing");
  steps.push({ step: "Landing", amount: landing, from: 0, to: landing, kind: "total" });
  return steps;
}
