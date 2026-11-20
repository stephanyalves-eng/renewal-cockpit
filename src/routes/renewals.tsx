import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Minus, Plus, TriangleAlert } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { ExportButton } from "@/components/export-button";
import { PageContainer, PageHeader, TableToolbar } from "@/components/page-layout";
import { QuerySection } from "@/components/query-section";
import { useSession } from "@/hooks/use-session";
import type { ExportColumn } from "@/lib/export-excel";
import { supabase } from "@/integrations/supabase/client";
import { clearOverrides, effectiveStatus, readOverrides, writeOverride, type StatusOverrides } from "@/lib/demo-status";
import { formatBrlCents, formatBrlFull } from "@/lib/money";
import { formatDate } from "@/lib/overview-format";
import { getRenewals } from "@/lib/renewals.functions";
import { CONTRACT_STATUSES, type RenewalRow } from "@/lib/renewals.types";

/** Same columns as the table, with the status the viewer sees (browser overrides included). */
function renewalExportColumns(statusOf: (r: RenewalRow) => string): ExportColumn<RenewalRow>[] {
  return [
    { header: "Vendor", value: (r) => r.vendor_name },
    { header: "Category", value: (r) => r.category },
    { header: "End date", value: (r) => r.end_date },
    { header: "Auto-renew", value: (r) => (r.auto_renew ? "Yes" : "No") },
    { header: "Notice (days)", value: (r) => r.notice_days },
    { header: "Decision deadline", value: (r) => r.decision_deadline },
    { header: "Urgent", value: (r) => (r.urgent ? "Urgent" : "") },
    { header: "Days left", value: (r) => r.days_to_deadline },
    { header: "Recommendation", value: (r) => r.recommendation },
    { header: "Estimated annual impact (BRL)", value: (r) => r.estimated_annual_impact },
    { header: "Status", value: statusOf },
  ];
}

const renewalsQueryOptions = queryOptions({ queryKey: ["renewals"], queryFn: () => getRenewals() });
const DESCRIPTION = "Every contract ending in the next 120 days, with or without auto-renewal: when to decide, what to do and what it is worth.";

export const Route = createFileRoute("/renewals")({
  head: () => ({
    meta: [
      { title: "Renewals · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Renewals · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(renewalsQueryOptions);
  },
  component: Page,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-6xl px-4 py-16" role="alert">
      <h1 className="page-title text-4xl">The Renewals page couldn't load</h1>
      <p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
    </main>
  ),
  notFoundComponent: () => <main className="mx-auto max-w-6xl px-4 py-16">Renewals not found.</main>,
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";
const label = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

function Page() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Renewals" title="Renewals" description={DESCRIPTION} />
      <QuerySection fallback={<TableSkeleton />} errorTitle="Renewals couldn't load">
        <RenewalsTable />
      </QuerySection>
    </PageContainer>
  );
}

function TableSkeleton() {
  return (
    <div className="surface mt-8 animate-pulse px-5 py-5" aria-busy="true" aria-label="Loading renewals">
      <div className="h-4 w-64 max-w-full bg-muted" />
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="mt-4 h-8 bg-muted" />)}
    </div>
  );
}

type SortKey = "deadline" | "impact_desc" | "impact_asc";

function useStatusEditor() {
  const session = useSession();
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<StatusOverrides>({});
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setOverrides(readOverrides()), []);

  async function change(contractId: string, status: string) {
    setError(null);
    if (!session) {
      setOverrides(writeOverride(contractId, status));
      return;
    }
    const { data, error: err } = await supabase
      .from("contracts")
      .update({ status })
      .eq("contract_id", contractId)
      .select("contract_id");
    if (err || !data || data.length === 0) {
      setError(`Status for ${contractId} wasn't saved: your account isn't allowed to change it, or the contract wasn't found.`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["renewals"] });
  }

  function reset() {
    clearOverrides();
    setOverrides({});
  }

  return { signedIn: !!session, overrides, error, change, reset };
}

function StatusSelect({ row, value, onChange }: { row: RenewalRow; value: string; onChange: (v: string) => void }) {
  return (
    <select
      aria-label={`Status for ${row.vendor_name}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${focusRing} w-full min-w-[10.5rem] max-w-[12rem] rounded-[2px] border border-input bg-card px-2 py-1 text-sm`}
    >
      {!CONTRACT_STATUSES.includes(value as never) && <option value={value}>{label(value)}</option>}
      {CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
    </select>
  );
}

function Deadline({ row }: { row: RenewalRow }) {
  return (
    <span className="flex flex-col">
      <span className="tabular-nums">{formatDate(row.decision_deadline)}</span>
      {row.urgent && (
        <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-bronze">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Urgent
        </span>
      )}
    </span>
  );
}

function Details({ row, secondary = false }: { row: RenewalRow; secondary?: boolean }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
      {secondary && (
        <>
          <dt className="text-muted-foreground">Est. annual impact</dt><dd className="tabular-nums">{formatBrlFull(row.estimated_annual_impact)}</dd>
          <dt className="text-muted-foreground">Days left to decide</dt><dd className="tabular-nums">{row.days_to_deadline}</dd>
          <dt className="text-muted-foreground">Contract ends</dt><dd className="tabular-nums">{formatDate(row.end_date)}</dd>
          <dt className="text-muted-foreground">Auto-renew · Notice</dt><dd>{row.auto_renew ? "Yes" : "No"} · {row.notice_days} days</dd>
          <dt className="text-muted-foreground">Category</dt><dd>{row.category}</dd>
        </>
      )}
      {row.rationale && (<><dt className="text-muted-foreground">Rationale</dt><dd>{row.rationale}</dd></>)}
      {row.utilization !== null && (<><dt className="text-muted-foreground">Utilization</dt><dd className="tabular-nums">{(row.utilization * 100).toFixed(1)}%</dd></>)}
      {row.target_seats !== null && (<><dt className="text-muted-foreground">Target seats</dt><dd className="tabular-nums">{row.target_seats}</dd></>)}
      {row.consolidate_into && (<><dt className="text-muted-foreground">Consolidate into</dt><dd>{row.consolidate_into}</dd></>)}
    </dl>
  );
}

function ExpandButton({ row, open, onToggle, controls }: { row: RenewalRow; open: boolean; onToggle: () => void; controls: string }) {
  const Icon = open ? Minus : Plus;
  return (
    <button type="button" aria-expanded={open} aria-controls={controls} onClick={onToggle} className={`${focusRing} rounded-[2px] p-1 text-forest hover:bg-secondary`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{open ? "Hide" : "Show"} details for {row.vendor_name}</span>
    </button>
  );
}

function RenewalsTable() {
  const { data } = useSuspenseQuery(renewalsQueryOptions);
  const [sort, setSort] = useState<SortKey>("deadline");
  const [open, setOpen] = useState<string | null>(null);
  const editor = useStatusEditor();

  if (data.length === 0) {
    return <section className="surface mt-8 px-6 py-12 text-center text-sm text-muted-foreground">No contracts in the renewal window.</section>;
  }

  const rows =
    sort === "deadline" ? data : [...data].sort((a, b) => (sort === "impact_desc" ? -1 : 1) * (a.estimated_annual_impact - b.estimated_annual_impact));
  const urgentCount = data.filter((r) => r.urgent).length;
  const total = data.reduce((s, r) => s + r.estimated_annual_impact, 0);
  const hasOverrides = Object.keys(editor.overrides).length > 0;
  const toggle = (id: string) => setOpen(open === id ? null : id);
  const nextImpactSort = sort === "impact_desc" ? "impact_asc" : "impact_desc";
  const SortIcon = sort === "impact_desc" ? ArrowDown : sort === "impact_asc" ? ArrowUp : null;
  const statusOf = (r: RenewalRow) => effectiveStatus(r.status, r.contract_id, editor.signedIn ? {} : editor.overrides);

  return (
    <>
      <TableToolbar
        count={
          <>
            <span className="font-medium text-forest">{data.length} contracts</span> ·{" "}
            <span className="inline-flex items-center gap-1 font-medium text-bronze">
              <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />{urgentCount} urgent
            </span>{" "}
            · Estimated annual impact <span className="font-medium tabular-nums text-forest">{formatBrlCents(total)}</span>
          </>
        }
      >
        <ExportButton page="renewals" columns={renewalExportColumns(statusOf)} rows={rows} />
      </TableToolbar>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-muted-foreground">Sort:</span>
        <button type="button" aria-pressed={sort === "deadline"} onClick={() => setSort("deadline")} className={`${focusRing} rounded-[2px] px-2 py-1 ${sort === "deadline" ? "bg-secondary font-medium text-forest" : "text-muted-foreground hover:text-forest"}`}>
          Decision deadline
        </button>
        <button type="button" aria-pressed={sort !== "deadline"} onClick={() => setSort(nextImpactSort)} className={`${focusRing} inline-flex items-center gap-1 rounded-[2px] px-2 py-1 ${sort !== "deadline" ? "bg-secondary font-medium text-forest" : "text-muted-foreground hover:text-forest"}`}>
          Estimated annual impact {SortIcon && <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />}
          {sort !== "deadline" && <span className="sr-only">{sort === "impact_desc" ? "highest first" : "lowest first"}</span>}
        </button>
      </div>

      {!editor.signedIn && (
        <p className="mt-3 text-xs text-muted-foreground">
          Demo: status changes stay in your browser.{" "}
          {hasOverrides && (
            <button type="button" onClick={editor.reset} className={`${focusRing} font-medium text-forest underline underline-offset-2`}>Reset</button>
          )}
        </p>
      )}
      {editor.error && <p role="alert" className="mt-3 text-sm text-destructive">{editor.error}</p>}

      {/* Desktop table */}
      <div className="surface mt-4 hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="eyebrow text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-8 px-2 py-3"><span className="sr-only">Details</span></th>
              <th className="px-2 py-3 font-normal">Vendor</th>
              <th className="px-2 py-3 font-normal" aria-sort={sort === "deadline" ? "ascending" : "none"}>Decision deadline</th>
              <th className="px-2 py-3 font-normal">Recommendation</th>
              <th className="px-2 py-3 font-normal">Status</th>
              <th className="px-2 py-3 text-right font-normal" aria-sort={sort === "impact_desc" ? "descending" : sort === "impact_asc" ? "ascending" : "none"}>Est. annual impact</th>
              <th className="px-2 py-3 text-right font-normal">Days left</th>
              <th className="px-2 py-3 font-normal">Ends</th>
              <th className="px-2 py-3 font-normal">Auto-renew</th>
              <th className="px-2 py-3 text-right font-normal">Notice</th>
              <th className="px-2 py-3 font-normal">Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOpen = open === row.contract_id;
              const id = `details-${row.contract_id}`;
              return (
                <Fragment key={row.contract_id}>
                  <tr className={`border-b border-border align-top ${isOpen ? "bg-secondary/50" : ""}`}>
                    <td className="px-2 py-3"><ExpandButton row={row} open={isOpen} onToggle={() => toggle(row.contract_id)} controls={id} /></td>
                    <td className="px-2 py-3 font-medium">
                      <Link to="/vendors/$vendorId" params={{ vendorId: row.vendor_id }} className={`${focusRing} text-forest underline decoration-sage underline-offset-2`}>{row.vendor_name}</Link>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap"><Deadline row={row} /></td>
                    <td className="px-2 py-3 font-medium">{row.recommendation}</td>
                    <td className="px-2 py-2"><StatusSelect row={row} value={statusOf(row)} onChange={(v) => void editor.change(row.contract_id, v)} /></td>
                    <td className="px-2 py-3 text-right whitespace-nowrap tabular-nums">{formatBrlFull(row.estimated_annual_impact)}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{row.days_to_deadline}</td>
                    <td className="px-2 py-3 whitespace-nowrap tabular-nums">{formatDate(row.end_date)}</td>
                    <td className="px-2 py-3">{row.auto_renew ? "Yes" : "No"}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{row.notice_days} d</td>
                    <td className="px-2 py-3 text-muted-foreground">{row.category}</td>
                  </tr>
                  {isOpen && (
                    <tr id={id} className="border-b border-border bg-secondary/50">
                      <td />
                      <td colSpan={10} className="px-2 pb-4"><Details row={row} /></td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile and tablet cards */}
      <ul className="mt-4 space-y-3 lg:hidden">
        {rows.map((row) => {
          const isOpen = open === row.contract_id;
          const id = `card-details-${row.contract_id}`;
          return (
            <li key={row.contract_id} className="surface px-4 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <Link to="/vendors/$vendorId" params={{ vendorId: row.vendor_id }} className={`${focusRing} font-medium text-forest underline decoration-sage underline-offset-2`}>{row.vendor_name}</Link>
                </div>
                <ExpandButton row={row} open={isOpen} onToggle={() => toggle(row.contract_id)} controls={id} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Decision deadline</dt><dd><Deadline row={row} /></dd></div>
                <div><dt className="text-xs text-muted-foreground">Recommendation</dt><dd className="font-medium">{row.recommendation}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1"><StatusSelect row={row} value={statusOf(row)} onChange={(v) => void editor.change(row.contract_id, v)} /></dd></div>
              </dl>
              {isOpen && <div id={id} className="mt-3 border-t border-border pt-3"><Details row={row} secondary /></div>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
