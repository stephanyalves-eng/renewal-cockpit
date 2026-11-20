import { createServerFn } from "@tanstack/react-start";
import type { SeatPoint, VendorDetail, VendorListRow } from "./vendors.types";

const toNum = (v: number | null) => (v === null ? null : Number(v));

/** Ids look like "V016". Anything else is treated as an unknown vendor (empty string), not an error. */
function vendorId(input: unknown): string {
  return typeof input === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(input) ? input : "";
}

export const getVendorList = createServerFn({ method: "GET" }).handler(async (): Promise<VendorListRow[]> => {
  const db = (await import("./public-db.server")).createPublicDb();
  const { data, error } = await db
    .from("v_vendor_detail")
    .select("vendor_id, vendor_name, category, status, recommendation")
    .order("vendor_name", { ascending: true });
  if (error) {
    console.error("v_vendor_detail list query failed", error);
    throw new Error("The vendor list is unavailable.");
  }
  return data.map((r) => ({
    vendor_id: r.vendor_id ?? "",
    vendor_name: r.vendor_name ?? "",
    category: r.category ?? "",
    status: r.status ?? "",
    recommendation: r.recommendation,
  }));
});

/** Returns null when the vendor id does not exist (the page shows "not found"). */
export const getVendorDetail = createServerFn({ method: "GET" })
  .inputValidator(vendorId)
  .handler(async ({ data: id }): Promise<VendorDetail | null> => {
    if (!id) return null;
    const db = (await import("./public-db.server")).createPublicDb();
    const { data, error } = await db.from("v_vendor_detail").select("*").eq("vendor_id", id).maybeSingle();
    if (error) {
      console.error("v_vendor_detail query failed", error);
      throw new Error("Vendor details are unavailable.");
    }
    if (!data) return null;
    return {
      vendor_id: data.vendor_id ?? "",
      vendor_name: data.vendor_name ?? "",
      category: data.category ?? "",
      capability: data.capability ?? "",
      owner_department: data.owner_department ?? "",
      criticality: data.criticality ?? "",
      risk_tier: data.risk_tier ?? "",
      contract_id: data.contract_id ?? "",
      start_date: data.start_date ?? "",
      end_date: data.end_date ?? "",
      auto_renew: data.auto_renew === true,
      notice_days: data.notice_days ?? 0,
      decision_deadline: data.decision_deadline ?? "",
      billing_model: data.billing_model ?? "",
      unit_price: Number(data.unit_price ?? 0),
      seats_contracted: data.seats_contracted,
      annual_value: Number(data.annual_value ?? 0),
      price_escalator_pct: Number(data.price_escalator_pct ?? 0),
      termination_fee: Number(data.termination_fee ?? 0),
      status: data.status ?? "",
      utilization_3m: toNum(data.utilization_3m),
      benchmark_product: data.benchmark_product,
      benchmark_price_per_seat: toNum(data.benchmark_price_per_seat),
      benchmark_source_url: data.benchmark_source_url,
      benchmark_as_of: data.benchmark_as_of,
      price_vs_benchmark_pct: toNum(data.price_vs_benchmark_pct),
      fy_landing: toNum(data.fy_landing),
      fy_budget: toNum(data.fy_budget),
      recommendation: data.recommendation,
      estimated_annual_impact: toNum(data.estimated_annual_impact),
      rule_explanation: data.rule_explanation ?? "",
    };
  });

export const getSeatUtilization = createServerFn({ method: "GET" })
  .inputValidator(vendorId)
  .handler(async ({ data: id }): Promise<SeatPoint[]> => {
    if (!id) return [];
    const db = (await import("./public-db.server")).createPublicDb();
    const { data, error } = await db
      .from("v_seat_utilization")
      .select("month, seats_active, seats_contracted")
      .eq("vendor_id", id)
      .order("month", { ascending: true });
    if (error) {
      console.error("v_seat_utilization query failed", error);
      throw new Error("Seat utilization is unavailable.");
    }
    return data.map((r) => ({
      month: r.month ?? "",
      seats_active: Number(r.seats_active ?? 0),
      seats_contracted: Number(r.seats_contracted ?? 0),
    }));
  });
