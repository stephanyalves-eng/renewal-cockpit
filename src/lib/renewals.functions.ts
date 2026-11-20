import { createServerFn } from "@tanstack/react-start";
import type { RenewalRow } from "./renewals.types";

export const getRenewals = createServerFn({ method: "GET" }).handler(async (): Promise<RenewalRow[]> => {
  const { createPublicDb } = await import("./public-db.server");
  const { data, error } = await createPublicDb()
    .from("v_renewals_due")
    .select(
      "contract_id, vendor_id, vendor_name, category, end_date, auto_renew, notice_days, decision_deadline, days_to_deadline, recommendation, estimated_annual_impact, status, urgent, rationale, utilization, target_seats, consolidate_into",
    )
    .order("decision_deadline", { ascending: true });
  if (error) {
    console.error("v_renewals_due query failed", error);
    throw new Error("Renewals are unavailable.");
  }
  return data.map((r) => ({
    contract_id: r.contract_id ?? "",
    vendor_id: r.vendor_id ?? "",
    vendor_name: r.vendor_name ?? "",
    category: r.category ?? "",
    end_date: r.end_date ?? "",
    auto_renew: r.auto_renew === true,
    notice_days: r.notice_days ?? 0,
    decision_deadline: r.decision_deadline ?? "",
    days_to_deadline: r.days_to_deadline ?? 0,
    recommendation: r.recommendation ?? "",
    estimated_annual_impact: r.estimated_annual_impact ?? 0,
    status: r.status ?? "",
    urgent: r.urgent === true,
    rationale: r.rationale,
    utilization: r.utilization,
    target_seats: r.target_seats,
    consolidate_into: r.consolidate_into,
  }));
});
