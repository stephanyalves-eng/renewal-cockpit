import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const EXTRACT_MODEL = "openai/gpt-6-astra";
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const FIELDS = ["end_date", "auto_renew", "notice_days", "price_escalator_pct", "termination_fee"] as const;

const json = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const field = (type: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: ["value", "confidence"],
  properties: { value: { anyOf: [type, { type: "null" }] }, confidence: { type: "number" } },
});
const schema = {
  type: "object",
  additionalProperties: false,
  required: [...FIELDS],
  properties: {
    end_date: field({ type: "string", description: "YYYY-MM-DD" }),
    auto_renew: field({ type: "boolean" }),
    notice_days: field({ type: "integer" }),
    price_escalator_pct: field({ type: "number" }),
    termination_fee: field({ type: "number", description: "BRL amount" }),
  },
};

/** Owner-only: verifies the caller's JWT and app_admins row (under RLS) before any AI call. Never writes. */
export async function handleExtract(request: Request): Promise<Response> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token.split(".").length !== 3) return json(401, { error: "Sign in to extract contracts." });

  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const db = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data: u, error: uErr } = await db.auth.getUser(token);
  if (uErr || !u?.user) return json(401, { error: "Your session is invalid or expired. Sign in again." });
  const { data: adminRow, error: aErr } = await db.from("app_admins").select("user_id").eq("user_id", u.user.id).maybeSingle();
  if (aErr || !adminRow) {
    console.log("[extract-contract] rejected non-admin, no AI call", u.user.id);
    return json(403, { error: "Only the owner can run live extraction." });
  }

  let file: File | null = null;
  try {
    const f = (await request.formData()).get("file");
    file = f instanceof File ? f : null;
  } catch { /* handled below */ }
  if (!file) return json(400, { error: "Attach one PDF file." });
  if (file.type !== "application/pdf") return json(400, { error: "Only PDF files are accepted." });
  if (file.size > MAX_PDF_BYTES) return json(400, { error: "The file is larger than 5 MB." });
  if (file.size === 0) return json(400, { error: "The file is empty." });

  const aiKey = process.env["LOVABLE_API_KEY"];
  if (!aiKey) return json(500, { error: "AI is not configured on the server." });

  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));

  console.log("[extract-contract] calling AI for admin", u.user.id, file.name);
  const ai = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: EXTRACT_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "contract_terms", strict: true, schema } },
      input: [
        {
          role: "system",
          content:
            "Extract contract terms from the attached agreement. end_date as YYYY-MM-DD; auto_renew true/false; notice_days as an integer; price_escalator_pct as a number (4 means 4%); termination_fee as a number in BRL. Give each a confidence between 0 and 1. Use null with low confidence when a term is absent.",
        },
        {
          role: "user",
          content: [
            { type: "input_file", filename: file.name, file_data: `data:application/pdf;base64,${btoa(bin)}` },
            { type: "input_text", text: "Extract the five fields." },
          ],
        },
      ],
    }),
  });
  if (!ai.ok || !ai.body) {
    const t = await ai.text().catch(() => "");
    console.error("[extract-contract] AI error", ai.status, t.slice(0, 500));
    if (ai.status === 429) return json(429, { error: "The AI is busy. Try again in a minute." });
    if (ai.status === 402) return json(402, { error: "AI credits are used up." });
    return json(502, { error: "The AI could not read this contract." });
  }

  let text = "", buf = "", failed = false;
  const reader = ai.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const fr of frames) {
      const line = fr.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const d = line.slice(5).trim();
      if (d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d) as { type?: string; delta?: string };
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev.type === "response.failed" || ev.type === "error" || ev.type === "response.refusal.delta") failed = true;
      } catch { /* partial frame */ }
    }
  }
  let parsed: Record<string, { value: unknown; confidence: number } | undefined>;
  try {
    if (failed) throw new Error("failed");
    parsed = JSON.parse(text);
  } catch {
    console.error("[extract-contract] unreadable AI output", text.slice(0, 300));
    return json(502, { error: "The AI could not read this contract." });
  }
  const fields = FIELDS.map((f) => ({
    field: f,
    value: parsed[f]?.value ?? null,
    confidence: Math.max(0, Math.min(1, Number(parsed[f]?.confidence ?? 0))),
  }));
  return json(200, { model: EXTRACT_MODEL, file_name: file.name, fields });
}
