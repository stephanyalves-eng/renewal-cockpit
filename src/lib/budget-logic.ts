import type { BudgetFilters, Component, MonthlyVarianceRow, TrendRow, WaterfallRow, WaterfallScope } from "./budget.types";

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

/* ---------- v_variance_monthly helpers ---------- */

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Rows for the current filters: category and department, then either one month (full-year rows of
 * that month, which equal the year-to-date rows for closed months) or the whole chosen period.
 */
export function periodRows(rows: MonthlyVarianceRow[], f: BudgetFilters): MonthlyVarianceRow[] {
  const sliced = filterRows(rows, f.category ? [f.category] : [], f.department ? [f.department] : []);
  if (f.month) return sliced.filter((r) => r.scope === "fy_landing" && r.month === f.month);
  return sliced.filter((r) => r.scope === f.period);
}

export type SplitTotals = { budget: number; price: number; volume: number; unbudgeted: number; landing: number };

export function sumSplit(rows: MonthlyVarianceRow[]): SplitTotals {
  const t = { budget: 0, price: 0, volume: 0, unbudgeted: 0, landing: 0 };
  for (const r of rows) {
    t.budget += r.budget;
    t.price += r.price;
    t.volume += r.volume;
    t.unbudgeted += r.unbudgeted;
    t.landing += r.landing;
  }
  return { budget: round2(t.budget), price: round2(t.price), volume: round2(t.volume), unbudgeted: round2(t.unbudgeted), landing: round2(t.landing) };
}

export function stepsFromTotals(t: SplitTotals): WaterfallStep[] {
  const steps: WaterfallStep[] = [{ step: "Budget", amount: t.budget, from: 0, to: t.budget, kind: "total" }];
  let running = t.budget;
  for (const [step, amount] of [["Price", t.price], ["Volume", t.volume], ["Unbudgeted", t.unbudgeted]] as const) {
    const next = round2(running + amount);
    steps.push({ step, amount, from: running, to: next, kind: "change" });
    running = next;
  }
  steps.push({ step: "Landing", amount: t.landing, from: 0, to: t.landing, kind: "total" });
  return steps;
}

/** One component per fiscal-year month (full-year rows), for category and department only. */
export function componentByMonth(
  rows: MonthlyVarianceRow[],
  f: BudgetFilters,
  component: Component,
): { month: string; value: number; is_forecast: boolean }[] {
  const sliced = filterRows(rows, f.category ? [f.category] : [], f.department ? [f.department] : []).filter((r) => r.scope === "fy_landing");
  const byMonth = new Map<string, { month: string; value: number; is_forecast: boolean }>();
  for (const r of sliced) {
    const p = byMonth.get(r.month) ?? { month: r.month, value: 0, is_forecast: r.is_forecast };
    p.value = round2(p.value + r[component]);
    byMonth.set(r.month, p);
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function landingSplit(rows: MonthlyVarianceRow[]): { actual: number; forecast: number } {
  return {
    actual: round2(rows.filter((r) => !r.is_forecast).reduce((s, r) => s + r.landing, 0)),
    forecast: round2(rows.filter((r) => r.is_forecast).reduce((s, r) => s + r.landing, 0)),
  };
}
