export type OverviewKpis = {
  anchor_date: string;
  fiscal_year: number;
  fy_landing: number;
  fy_budget: number;
  landing_vs_budget: number;
  landing_vs_budget_pct: number;
  savings_ytd: number;
  cost_avoidance_ytd: number;
  renewals_next_90_days: number;
  urgent_decisions: number;
  value_at_risk_auto_renewal: number;
};

export type CategoryLanding = {
  category: string;
  landing: number;
  budget_fy: number;
  landing_vs_budget: number;
  landing_vs_budget_pct: number;
};

export type UrgentRenewal = {
  contract_id: string;
  vendor_name: string;
  decision_deadline: string;
  recommendation: string;
  auto_renew: boolean;
  rationale: string;
  estimated_annual_impact: number;
  end_date: string;
};
