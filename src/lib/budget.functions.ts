import { createServerFn } from "@tanstack/react-start";
import type { TrendRow, WaterfallRow, WaterfallScope } from "./budget.types";

const num = (v: number | null) => (v === null ? null : Number(v));

export const getMonthlyTrend = createServerFn({ method: "GET" }).handler(async (): Promise<TrendRow[]> => {
  const db = (await import("./public-db.server")).createPublicDb();
  const { data, error } = await db
    .from("v_monthly_trend")
    .select("month, category, owner_department, actual, budget, forecast")
    .order("month", { ascending: true });
  if (error) {
    console.error("v_monthly_trend query failed", error);
    throw new Error("Monthly figures are unavailable.");
  }
  return data.map((r) => ({
    month: r.month ?? "",
    category: r.category ?? "",
    owner_department: r.owner_department ?? "",
    actual: num(r.actual),
    budget: num(r.budget),
    forecast: num(r.forecast),
  }));
});

export const getVarianceWaterfall = createServerFn({ method: "GET" }).handler(async (): Promise<WaterfallRow[]> => {
  const db = (await import("./public-db.server")).createPublicDb();
  const { data, error } = await db
    .from("v_variance_waterfall")
    .select("fiscal_year, scope, category, owner_department, budget, price, volume, unbudgeted, landing");
  if (error) {
    console.error("v_variance_waterfall query failed", error);
    throw new Error("Variance figures are unavailable.");
  }
  return data.map((r) => ({
    fiscal_year: r.fiscal_year ?? 0,
    scope: (r.scope ?? "fy_landing") as WaterfallScope,
    category: r.category ?? "",
    owner_department: r.owner_department ?? "",
    budget: Number(r.budget ?? 0),
    price: Number(r.price ?? 0),
    volume: Number(r.volume ?? 0),
    unbudgeted: Number(r.unbudgeted ?? 0),
    landing: Number(r.landing ?? 0),
  }));
});
