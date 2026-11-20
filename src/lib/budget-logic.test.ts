import { describe, expect, it } from "vitest";
import { filterRows, lastActualMonth, monthlySeries, optionsOf, waterfallSteps } from "./budget-logic";
import type { TrendRow, WaterfallRow } from "./budget.types";

const trend: TrendRow[] = [
  { month: "2026-10-01", category: "Cloud", owner_department: "Engineering", actual: 100, budget: 90, forecast: null },
  { month: "2026-10-01", category: "SaaS", owner_department: "IT", actual: 50, budget: 60, forecast: null },
  { month: "2026-11-01", category: "Cloud", owner_department: "Engineering", actual: 110, budget: 95, forecast: null },
  { month: "2026-12-01", category: "Cloud", owner_department: "Engineering", actual: null, budget: 100, forecast: 120 },
  { month: "2026-12-01", category: "SaaS", owner_department: "IT", actual: null, budget: 60, forecast: 55 },
  { month: "2027-01-01", category: "Cloud", owner_department: "Engineering", actual: null, budget: null, forecast: 125 },
];

const waterfall: WaterfallRow[] = [
  { fiscal_year: 2026, scope: "fy_landing", category: "Cloud", owner_department: "Engineering", budget: 1000, price: -20, volume: 150, unbudgeted: 0, landing: 1130 },
  { fiscal_year: 2026, scope: "fy_landing", category: "SaaS", owner_department: "IT", budget: 500, price: 10, volume: -30, unbudgeted: 40, landing: 520 },
  { fiscal_year: 2026, scope: "ytd", category: "Cloud", owner_department: "Engineering", budget: 900, price: -18, volume: 140, unbudgeted: 0, landing: 1022 },
];

describe("filters", () => {
  it("keeps everything when no filter is selected", () => expect(filterRows(trend, [], [])).toHaveLength(6));
  it("filters by category and department together", () => {
    expect(filterRows(trend, ["Cloud"], [])).toHaveLength(4);
    expect(filterRows(trend, ["Cloud"], ["IT"])).toHaveLength(0);
  });
  it("lists sorted distinct options", () => expect(optionsOf(trend, "category")).toEqual(["Cloud", "SaaS"]));
});

describe("monthly series", () => {
  it("sums each series per month and keeps null where a series has no value", () => {
    const s = monthlySeries(trend);
    expect(s.map((p) => p.month)).toEqual(["2026-10-01", "2026-11-01", "2026-12-01", "2027-01-01"]);
    expect(s[0]).toMatchObject({ actual: 150, budget: 150, forecast: null });
    expect(s[2]).toMatchObject({ actual: null, budget: 160, forecast: 175 });
    expect(s[3]).toMatchObject({ budget: null, forecast: 125 });
  });
  it("starts the dashed forecast line at the last actual point", () => {
    const s = monthlySeries(trend);
    expect(s[1]).toMatchObject({ actual: 110, forecastLine: 110 });
    expect(s[0]!.forecastLine).toBeNull();
    expect(s[2]!.forecastLine).toBe(175);
  });
  it("finds the last month with actuals", () => expect(lastActualMonth(monthlySeries(trend))).toBe("2026-11-01"));
});

describe("waterfall", () => {
  it("walks from budget to landing in the selected scope", () => {
    const steps = waterfallSteps(waterfall, "fy_landing");
    expect(steps.map((s) => s.step)).toEqual(["Budget", "Price", "Volume", "Unbudgeted", "Landing"]);
    expect(steps.map((s) => s.amount)).toEqual([1500, -10, 120, 40, 1650]);
  });
  it("floats each change from the running total", () => {
    const [, price, volume, unbudgeted] = waterfallSteps(waterfall, "fy_landing");
    expect(price).toMatchObject({ from: 1500, to: 1490 });
    expect(volume).toMatchObject({ from: 1490, to: 1610 });
    expect(unbudgeted).toMatchObject({ from: 1610, to: 1650 });
  });
  it("the steps add up to the landing to the cent", () => {
    const s = waterfallSteps(waterfall, "fy_landing");
    expect(s[3]!.to).toBeCloseTo(s[4]!.amount, 2);
  });
  it("uses only the chosen scope", () => expect(waterfallSteps(waterfall, "ytd")[0]!.amount).toBe(900));
});
