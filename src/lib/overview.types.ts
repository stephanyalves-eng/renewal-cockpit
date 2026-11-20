export type OverviewKpis = {
  anchor_date: string;
  fiscal_year: number;
  fy_landing: number;
  fy_budget: number;
  landing_vs_budget: number;
  /** Null when the slice has no budget (the percentage is undefined, shown as "—"). */
  landing_vs_budget_pct: number | null;
  savings_ytd: number;
  cost_avoidance_ytd: number;
  renewals_next_90_days: number;
  urgent_decisions: number;
  value_at_risk_auto_renewal: number;
};

/** One row of v_kpis_by_category: the same KPIs, for one category. */
export type CategoryKpis = OverviewKpis & { category: string };

export type CategoryLanding = {
  category: string;
  landing: number;
  budget_fy: number;
  landing_vs_budget: number;
  landing_vs_budget_pct: number;
};

export type UrgentRenewal = {
  contract_id: string;
  category: string;
  vendor_name: string;
  decision_deadline: string;
  recommendation: string;
  auto_renew: boolean;
  rationale: string;
  estimated_annual_impact: number;
  end_date: string;
};
