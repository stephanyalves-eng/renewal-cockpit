import { createServerFn } from "@tanstack/react-start";

export type ContractOption = { contract_id: string; vendor_name: string };

export const getContractOptions = createServerFn({ method: "GET" }).handler(async (): Promise<ContractOption[]> => {
  const db = (await import("./public-db.server")).createPublicDb();
  const [c, v] = await Promise.all([
    db.from("contracts").select("contract_id, vendor_id").order("contract_id"),
    db.from("vendors").select("vendor_id, name"),
  ]);
  if (c.error || v.error) throw new Error("Contracts are unavailable.");
  const names = new Map(v.data.map((r) => [r.vendor_id, r.name]));
  return c.data.map((r) => ({ contract_id: r.contract_id, vendor_name: names.get(r.vendor_id) ?? r.vendor_id }));
});
