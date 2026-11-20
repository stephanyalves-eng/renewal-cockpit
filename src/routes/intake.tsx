import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, CircleCheck, CircleHelp, CircleX, TriangleAlert } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-layout";
import { QuerySection } from "@/components/query-section";
import { useSession } from "@/hooks/use-session";
import { ExtractContractCard, useIsAdmin } from "@/components/extract-contract-card";
import { compareField, FIELD_LABEL, formatFieldValue, groupByFile, onFileRaw, type ExtractionGroup } from "@/lib/intake-logic";
import { getIntakeData } from "@/lib/intake.functions";
import type { ContractTerms, IntakeField } from "@/lib/intake.types";
import { formatDate } from "@/lib/overview-format";

const intakeQuery = queryOptions({ queryKey: ["intake"], queryFn: () => getIntakeData() });
const DESCRIPTION = "An AI step reads a contract PDF and extracts the terms that drive renewal decisions; a person reviews every field.";
const SAMPLES_URL = "https://github.com/stephanyalves-eng/vendor-renewal-cockpit/blob/main/data/contracts";
const SAMPLES = [
  { file: "C013_dealstream.pdf", why: "Auto-renews with an urgent deadline" },
  { file: "C019_contractly.pdf", why: "Price escalator above inflation" },
  { file: "C016_workwell_suite.pdf", why: "Per-seat price above the public benchmark" },
];

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Contract intake · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Contract intake · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(intakeQuery);
  },
  component: Page,
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

function Page() {
  const session = useSession();
  const isAdmin = useIsAdmin(session);
  return (
    <PageContainer>
      <PageHeader eyebrow="Intake" title="Contract intake" description={DESCRIPTION} />

      <section className="surface mt-6 px-5 py-5" aria-labelledby="samples-title">
        <h2 id="samples-title" className="text-xl font-normal">Sample contracts</h2>
        <p className="mt-1 text-sm text-muted-foreground">Three synthetic agreements with fictional parties, built from the contracts table.</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          {SAMPLES.map((s) => (
            <li key={s.file} className="border-t border-border pt-2">
              <a href={`${SAMPLES_URL}/${s.file}`} target="_blank" rel="noreferrer" className={`${focusRing} inline-flex items-center gap-0.5 font-medium text-forest underline decoration-sage underline-offset-2`}>
                {s.file}<ArrowUpRight className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
              <p className="text-muted-foreground">{s.why}</p>
            </li>
          ))}
        </ul>
        {!(session && isAdmin) && <p className="mt-4 text-sm text-muted-foreground">
          {session
            ? "Live extraction is limited to the owner."
            : "Live extraction is limited to the owner to keep this demo free to run."}
        </p>}
      </section>

      {session && isAdmin && <ExtractContractCard session={session} />}

      <QuerySection fallback={<div className="mt-6 h-72 animate-pulse bg-muted" aria-busy="true" aria-label="Loading extractions" />} errorTitle="Stored extractions couldn't load">
        <StoredExtractions />
      </QuerySection>
    </PageContainer>
  );
}

function StoredExtractions() {
  const { data } = useSuspenseQuery(intakeQuery);
  const groups = groupByFile(data.extractions);
  const termsById = new Map(data.terms.map((t) => [t.contract_id, t]));
  if (groups.length === 0) {
    return (
      <section className="surface mt-6 px-6 py-10 text-center">
        <p className="eyebrow text-muted-foreground">No extractions yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Results from the AI extraction of the sample contracts appear here, field by field, next to the values on file.
        </p>
      </section>
    );
  }
  return (
    <div className="mt-6 space-y-6">
      {groups.map((g, i) => (
        <ExtractionCard key={g.file_name} group={g} terms={g.contract_id ? termsById.get(g.contract_id) : undefined} defaultOpen={i === 0} />
      ))}
    </div>
  );
}


function CheckStatus({ results }: { results: ("match" | "differs" | "missing")[] }) {
  const differ = results.filter((r) => r === "differs").length;
  const matched = results.filter((r) => r === "match").length;
  if (differ > 0)
    return <span className="inline-flex items-center gap-1 text-sm font-medium text-bronze"><CircleX className="h-4 w-4" aria-hidden="true" />{differ} of {results.length} differ</span>;
  if (matched === results.length)
    return <span className="inline-flex items-center gap-1 text-sm font-medium text-forest"><CircleCheck className="h-4 w-4" aria-hidden="true" />{matched} of {results.length} match</span>;
  return <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><CircleHelp className="h-4 w-4" aria-hidden="true" />{matched} of {results.length} match, rest not compared</span>;
}

function ExtractionCard({ group, terms, defaultOpen }: { group: ExtractionGroup; terms: ContractTerms | undefined; defaultOpen: boolean }) {
  const results = group.fields.map((f) => (terms ? compareField(f.field, f.extracted_value, terms) : "missing"));
  return (
    <details className="surface group px-5 py-4" open={defaultOpen} aria-label={`Extraction of ${group.file_name}`}>
      <summary className={`${focusRing} flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1`}>
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <CheckStatus results={results} />
          <span className="text-lg font-normal text-forest">{group.file_name}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {group.contract_id && <>Contract {group.contract_id} · </>}
          {group.model ?? "Model not recorded"} · {formatDate(group.extracted_at)}
          <span className="ml-2 text-forest group-open:hidden" aria-hidden="true">Show</span>
          <span className="ml-2 hidden text-forest group-open:inline" aria-hidden="true">Hide</span>
        </span>
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="eyebrow text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-normal">Field</th>
              <th className="py-2 pr-3 font-normal">Extracted</th>
              <th className="py-2 pr-3 font-normal">Confidence</th>
              <th className="py-2 pr-3 font-normal">On file</th>
              <th className="py-2 font-normal">Check</th>
            </tr>
          </thead>
          <tbody>
            {group.fields.map((f, idx) => {
              const result = results[idx]!;
              const shown = formatFieldValue(f.field, f.extracted_value);
              return (
                <tr key={f.field} className={`border-b border-border align-top last:border-0 ${result === "differs" ? "bg-bronze/10" : ""}`}>
                  <td className="py-2.5 pr-3 font-medium">{FIELD_LABEL[f.field]}</td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {shown}
                    {f.extracted_value !== null && f.extracted_value !== shown && (
                      <span className="block text-xs text-muted-foreground">raw: {f.extracted_value}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {f.confidence !== null ? `${Math.round(f.confidence * 100)}%` : "—"}
                    {f.uncertain && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-bronze">
                        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />Unsure
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums">{terms ? formatFieldValue(f.field, onFileRaw(f.field, terms)) : "—"}</td>
                  <td className="py-2.5">
                    {result === "match" && <span className="inline-flex items-center gap-1 text-forest"><CircleCheck className="h-4 w-4" aria-hidden="true" />Match</span>}
                    {result === "differs" && <span className="inline-flex items-center gap-1 font-medium text-bronze"><CircleX className="h-4 w-4" aria-hidden="true" />Differs</span>}
                    {result === "missing" && <span className="inline-flex items-center gap-1 text-muted-foreground"><CircleHelp className="h-4 w-4" aria-hidden="true" />Not compared</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
