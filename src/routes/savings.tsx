import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExportButton } from "@/components/export-button";
import { QuerySection } from "@/components/query-section";
import type { ExportColumn } from "@/lib/export-excel";
import { formatBrlCents, formatBrlFull, formatBrlKpi } from "@/lib/money";
import { formatDate } from "@/lib/overview-format";
import { getSavings, type SavingsEvent } from "@/lib/savings.functions";

const savingsQuery = queryOptions({ queryKey: ["savings"], queryFn: () => getSavings() });
const DESCRIPTION = "Negotiated price reductions, split into savings against a previous price and cost avoidance against a first quote.";

export const Route = createFileRoute("/savings")({
  head: () => ({
    meta: [
      { title: "Savings · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Savings · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(savingsQuery);
  },
  component: Page,
});

const TYPE_LABEL = { saving: "Saving", cost_avoidance: "Cost avoidance" } as const;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

const exportColumns: ExportColumn<SavingsEvent>[] = [
  { header: "Date", value: (r) => r.date },
  { header: "Vendor", value: (r) => r.vendor_name },
  { header: "Type", value: (r) => TYPE_LABEL[r.type] },
  { header: "Baseline price (BRL)", value: (r) => r.baseline_price },
  { header: "Negotiated price (BRL)", value: (r) => r.negotiated_price },
  { header: "Annualized impact (BRL)", value: (r) => r.annualized_impact },
  { header: "Note", value: (r) => r.note },
];

function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
      <p className="eyebrow text-muted-foreground">Savings</p>
      <h1 className="page-title mt-2 text-4xl sm:text-5xl">Savings</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">
        A saving is a lower price than we paid before; cost avoidance is a lower price than the first quote for
        something we never bought.
      </p>
      <QuerySection fallback={<div className="mt-8 h-72 animate-pulse bg-muted" aria-busy="true" aria-label="Loading savings" />} errorTitle="Savings couldn't load">
        <SavingsLog />
      </QuerySection>
    </main>
  );
}

function SavingsLog() {
  const { data } = useSuspenseQuery(savingsQuery);
  if (data.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No savings events yet.</p>;
  const total = (t: SavingsEvent["type"]) => data.filter((r) => r.type === t).reduce((s, r) => s + r.annualized_impact, 0);
  return (
    <>
      <dl className="surface mt-8 grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {(["saving", "cost_avoidance"] as const).map((t) => (
          <div key={t} className="px-5 py-4">
            <dt className="text-sm font-medium text-forest/80">{TYPE_LABEL[t]} · annualized</dt>
            <dd className="mt-2 text-3xl font-medium tabular-nums text-forest">{formatBrlKpi(total(t))}</dd>
            <dd className="mt-1 text-sm text-muted-foreground">{data.filter((r) => r.type === t).length} events</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{data.length} events, oldest first</p>
        <ExportButton page="savings" columns={exportColumns} rows={data} />
      </div>

      <div className="surface mt-3 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Savings events</caption>
          <thead className="eyebrow text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3 font-normal">Date</th>
              <th className="px-4 py-3 font-normal">Vendor</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 text-right font-normal">Baseline</th>
              <th className="px-4 py-3 text-right font-normal">Negotiated</th>
              <th className="px-4 py-3 text-right font-normal">Annualized impact</th>
              <th className="px-4 py-3 font-normal">Note</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.event_id} className="border-b border-border align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{formatDate(r.date)}</td>
                <td className="px-4 py-2.5 font-medium">
                  <Link to="/vendors/$vendorId" params={{ vendorId: r.vendor_id }} className={`${focusRing} text-forest underline decoration-sage underline-offset-2`}>
                    {r.vendor_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">{TYPE_LABEL[r.type]}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatBrlCents(r.baseline_price)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatBrlCents(r.negotiated_price)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatBrlFull(r.annualized_impact)}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
