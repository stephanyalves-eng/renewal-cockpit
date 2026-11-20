export type VendorListRow = {
  vendor_id: string;
  vendor_name: string;
  category: string;
  status: string;
  recommendation: string | null;
};

export type VendorDetail = {
  vendor_id: string;
  vendor_name: string;
  category: string;
  capability: string;
  owner_department: string;
  criticality: string;
  risk_tier: string;
  contract_id: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  notice_days: number;
  decision_deadline: string;
  billing_model: string;
  unit_price: number;
  seats_contracted: number | null;
  annual_value: number;
  price_escalator_pct: number;
  termination_fee: number;
  status: string;
  utilization_3m: number | null;
  benchmark_product: string | null;
  benchmark_price_per_seat: number | null;
  benchmark_source_url: string | null;
  benchmark_as_of: string | null;
  price_vs_benchmark_pct: number | null;
  fy_landing: number | null;
  fy_budget: number | null;
  recommendation: string | null;
  estimated_annual_impact: number | null;
  rule_explanation: string;
};

export type SeatPoint = { month: string; seats_active: number; seats_contracted: number };
