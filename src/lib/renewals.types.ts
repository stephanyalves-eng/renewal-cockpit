export const CONTRACT_STATUSES = ["onboarding", "active", "renewal_window", "renegotiating", "terminated"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export type RenewalRow = {
  contract_id: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  end_date: string;
  auto_renew: boolean;
  notice_days: number;
  decision_deadline: string;
  days_to_deadline: number;
  recommendation: string;
  estimated_annual_impact: number;
  status: string;
  urgent: boolean;
  rationale: string | null;
  utilization: number | null;
  target_seats: number | null;
  consolidate_into: string | null;
};
