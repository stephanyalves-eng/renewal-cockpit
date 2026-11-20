import { createServerFn } from "@tanstack/react-start";
import type { CategoryLanding, OverviewKpis } from "./overview.types";

function requiredNumber(value: number | null, field: string): number {
  if (value === null) throw new Error(`Missing numeric field: ${field}`);
  return value;
}

function requiredString(value: string | null, field: string): string {
  if (value === null) throw new Error(`Missing text field: ${field}`);
  return value;
}

export const getOverviewKpis = createServerFn({ method: "GET" }).handler(async (): Promise<OverviewKpis> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("v_kpis")
    .select(
      "fiscal_year, fy_landing, fy_budget, landing_vs_budget, landing_vs_budget_pct, savings_ytd, cost_avoidance_ytd, renewals_next_90_days, urgent_decisions, value_at_risk_auto_renewal",
    )
    .single();

  if (error) {
    console.error("v_kpis query failed", error);
    throw new Error("Overview KPIs are unavailable.");
  }

  return {
    fiscal_year: requiredNumber(data.fiscal_year, "fiscal_year"),
    fy_landing: requiredNumber(data.fy_landing, "fy_landing"),
    fy_budget: requiredNumber(data.fy_budget, "fy_budget"),
    landing_vs_budget: requiredNumber(data.landing_vs_budget, "landing_vs_budget"),
    landing_vs_budget_pct: requiredNumber(data.landing_vs_budget_pct, "landing_vs_budget_pct"),
    savings_ytd: requiredNumber(data.savings_ytd, "savings_ytd"),
    cost_avoidance_ytd: requiredNumber(data.cost_avoidance_ytd, "cost_avoidance_ytd"),
    renewals_next_90_days: requiredNumber(data.renewals_next_90_days, "renewals_next_90_days"),
    urgent_decisions: requiredNumber(data.urgent_decisions, "urgent_decisions"),
    value_at_risk_auto_renewal: requiredNumber(
      data.value_at_risk_auto_renewal,
      "value_at_risk_auto_renewal",
    ),
  };
});

export const getCategoryLanding = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryLanding[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("v_fy_landing_by_category")
      .select("category, landing, budget_fy, landing_vs_budget, landing_vs_budget_pct")
      .order("landing", { ascending: false });

    if (error) {
      console.error("v_fy_landing_by_category query failed", error);
      throw new Error("Category landing figures are unavailable.");
    }

    return data.map((row) => ({
      category: requiredString(row.category, "category"),
      landing: requiredNumber(row.landing, "landing"),
      budget_fy: requiredNumber(row.budget_fy, "budget_fy"),
      landing_vs_budget: requiredNumber(row.landing_vs_budget, "landing_vs_budget"),
      landing_vs_budget_pct: requiredNumber(row.landing_vs_budget_pct, "landing_vs_budget_pct"),
    }));
  },
);
