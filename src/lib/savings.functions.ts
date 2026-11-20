import { createServerFn } from "@tanstack/react-start";

export type SavingsEvent = {
  event_id: string;
  date: string;
  vendor_id: string;
  vendor_name: string;
  type: "saving" | "cost_avoidance";
  baseline_price: number;
  negotiated_price: number;
  annualized_impact: number;
  note: string | null;
};

export const getSavings = createServerFn({ method: "GET" }).handler(async (): Promise<SavingsEvent[]> => {
  const db = (await import("./public-db.server")).createPublicDb();
  const { data, error } = await db
    .from("savings")
    .select("event_id, date, vendor_id, type, baseline_price, negotiated_price, annualized_impact, note, vendors!savings_vendor_id_fkey(name)")
    .order("date", { ascending: true });
  if (error) {
    console.error("savings query failed", error);
    throw new Error("Savings are unavailable.");
  }
  return data.map((r) => {
    const vendor = r.vendors as { name: string } | { name: string }[] | null;
    const name = Array.isArray(vendor) ? vendor[0]?.name : vendor?.name;
    return {
      event_id: r.event_id,
      date: r.date,
      vendor_id: r.vendor_id,
      vendor_name: name ?? r.vendor_id,
      type: r.type === "cost_avoidance" ? "cost_avoidance" : "saving",
      baseline_price: Number(r.baseline_price),
      negotiated_price: Number(r.negotiated_price),
      annualized_impact: Number(r.annualized_impact),
      note: r.note,
    };
  });
});
