import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { TriangleAlert } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getContractOptions } from "@/lib/intake-extract.functions";
import { FIELD_LABEL } from "@/lib/intake-logic";
import type { IntakeField } from "@/lib/intake.types";

type Result = { model: string; file_name: string; fields: { field: IntakeField; value: unknown; confidence: number }[] };
const MAX = 5 * 1024 * 1024;
const input = "mt-1 w-full rounded-[2px] border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-forest";
const button = "rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-ivory disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

/** Admin check through RLS: admins can read only their own app_admins row. */
export function useIsAdmin(session: Session | null) {
  const uid = session?.user.id;
  return useQuery({
    queryKey: ["is-admin", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from("app_admins").select("user_id").eq("user_id", uid!).maybeSingle();
      if (error) return false;
      return !!data;
    },
  }).data === true;
}

export function ExtractContractCard({ session }: { session: Session }) {
  const qc = useQueryClient();
  const contracts = useQuery({ queryKey: ["contract-options"], queryFn: () => getContractOptions() });
  const [contractId, setContractId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"extracting" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  async function extract(e: FormEvent) {
    e.preventDefault();
    setError(null); setSaved(null); setResult(null);
    if (!contractId) return setError("Choose a contract.");
    if (!file) return setError("Choose a PDF file.");
    if (file.type !== "application/pdf") return setError("Only PDF files are accepted.");
    if (file.size > MAX) return setError("The file is larger than 5 MB.");
    setBusy("extracting");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return setError("Sign in to extract contracts.");
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract-contract", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const json = (await res.json().catch(() => ({}))) as Partial<Result> & { error?: string };
      if (!res.ok) return setError(json.error ?? "Extraction failed.");
      const r = json as Result;
      setResult(r);
      setValues(Object.fromEntries(r.fields.map((f) => [f.field, f.value === null ? "" : String(f.value)])));
    } catch {
      setError("Extraction failed. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!result) return;
    setBusy("saving"); setError(null);
    const rows = result.fields.map((f) => ({
      contract_id: contractId,
      file_name: result.file_name,
      field: f.field,
      extracted_value: values[f.field]?.trim() || null,
      confidence: f.confidence,
      uncertain: f.confidence < 0.8,
      model: result.model,
    }));
    const { data, error: err } = await supabase.from("contract_extractions").insert(rows).select("extraction_id");
    setBusy(null);
    if (err || !data || data.length !== rows.length) return setError("The extraction was not saved. Your account may not be allowed to save.");
    setSaved(`Saved ${rows.length} fields for ${result.file_name}.`);
    setResult(null); setFile(null);
    await qc.invalidateQueries({ queryKey: ["intake"] });
  }

  return (
    <section className="surface mt-6 px-5 py-5" aria-labelledby="extract-title">
      <h2 id="extract-title" className="text-xl font-normal">Extract a contract</h2>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}. The AI reads the PDF; you review every field before saving.</p>
      <form onSubmit={extract} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm">Contract
          <select className={input} value={contractId} onChange={(e) => setContractId(e.target.value)} disabled={contracts.isLoading}>
            <option value="">{contracts.isLoading ? "Loading…" : contracts.isError ? "Contracts unavailable" : "Choose a contract"}</option>
            {contracts.data?.map((c) => <option key={c.contract_id} value={c.contract_id}>{c.contract_id} · {c.vendor_name}</option>)}
          </select>
        </label>
        <label className="text-sm">Contract PDF (max 5 MB)
          <input type="file" accept="application/pdf" className={input} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" className={button} disabled={busy !== null}>{busy === "extracting" ? "Reading the contract…" : "Extract"}</button>
      </form>
      {busy === "extracting" && <p className="mt-3 text-sm text-muted-foreground" role="status">Reading the PDF with AI. This can take up to a minute.</p>}
      {error && <p className="mt-3 text-sm font-medium text-destructive" role="alert">{error}</p>}
      {saved && <p className="mt-3 text-sm text-forest" role="status">{saved}</p>}

      {result && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="eyebrow text-muted-foreground">Review · {result.file_name} · {result.model}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {result.fields.map((f) => {
              const unsure = f.confidence < 0.8;
              return (
                <label key={f.field} className="text-sm">
                  <span className="flex flex-wrap items-center gap-2">
                    {FIELD_LABEL[f.field]}
                    <span className="text-xs text-muted-foreground tabular-nums">{Math.round(f.confidence * 100)}% confidence</span>
                    {unsure && <span className="inline-flex items-center gap-1 text-xs font-medium text-bronze"><TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />Unsure</span>}
                  </span>
                  <input className={`${input} tabular-nums`} value={values[f.field] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.field]: e.target.value }))} />
                </label>
              );
            })}
          </div>
          <button type="button" className={`${button} mt-4`} onClick={save} disabled={busy !== null}>{busy === "saving" ? "Saving…" : "Save extraction"}</button>
        </div>
      )}
    </section>
  );
}
