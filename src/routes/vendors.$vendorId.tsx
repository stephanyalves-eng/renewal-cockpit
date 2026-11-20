import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QuerySection } from "@/components/query-section";
import { formatBrlCents, formatBrlFull, formatBrlKpi } from "@/lib/money";
import { budgetDirection, dateParts, formatDate, formatPercent } from "@/lib/overview-format";
import { benchmarkComparison, humanize } from "@/lib/vendor-format";
import { getSeatUtilization, getVendorDetail } from "@/lib/vendors.functions";
import type { VendorDetail } from "@/lib/vendors.types";

const detailQuery = (id: string) => queryOptions({ queryKey: ["vendor", id], queryFn: () => getVendorDetail({ data: id }) });
const seatsQuery = (id: string) => queryOptions({ queryKey: ["vendor", id, "seats"], queryFn: () => getSeatUtilization({ data: id }) });
const DESCRIPTION = "Contract terms, seat utilization, price against a public benchmark and the renewal recommendation.";

export const Route = createFileRoute("/vendors/$vendorId")({
  head: () => ({
    meta: [
      { title: "Vendor detail · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Vendor detail · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(detailQuery(params.vendorId));
    void context.queryClient.prefetchQuery(seatsQuery(params.vendorId));
  },
  component: Page,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-6xl px-4 py-16" role="alert">
      <h1 className="page-title text-4xl">This vendor page couldn't load</h1>
      <p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
    </main>
  ),
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

function Page() {
  const { vendorId } = Route.useParams();
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
      <Link to="/vendors" className={`${focusRing} eyebrow text-muted-foreground hover:text-forest`}>← All vendors</Link>
      <QuerySection fallback={<div className="mt-6 h-96 animate-pulse bg-muted" aria-busy="true" aria-label="Loading vendor" />} errorTitle="Vendor details couldn't load">
        <VendorPage vendorId={vendorId} />
      </QuerySection>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 tabular-nums">{children}</dd>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`surface px-5 py-5 ${className}`}>
      <h2 className="text-xl font-normal">{title}</h2>
      {children}
    </section>
  );
}

function VendorPage({ vendorId }: { vendorId: string }) {
  const { data: v } = useSuspenseQuery(detailQuery(vendorId));
  if (!v) {
    return (
      <section className="surface mt-6 px-6 py-12 text-center">
        <h1 className="page-title text-3xl">Vendor not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">There is no vendor with id {vendorId}.</p>
      </section>
    );
  }
  return (
    <>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="eyebrow text-muted-foreground">{v.category} · {humanize(v.capability)}</p>
          <h1 className="page-title mt-2 text-4xl sm:text-5xl">{v.vendor_name}</h1>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {[["Criticality", v.criticality], ["Risk", v.risk_tier], ["Status", v.status]].map(([label, value]) => (
            <div key={label} className="flex gap-1">
              <dt>{label}:</dt>
              <dd className="font-medium text-forest">{humanize(value!)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="space-y-6">
          <TermsCard v={v} />
          {v.billing_model === "per_seat" && (
            <Card title="Seat utilization">
              <QuerySection fallback={<div className="mt-4 h-56 animate-pulse bg-muted" aria-busy="true" />} errorTitle="Seat utilization couldn't load">
                <SeatChart vendorId={v.vendor_id} utilization={v.utilization_3m} />
              </QuerySection>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <RecommendationCard v={v} />
          {v.benchmark_product && <BenchmarkCard v={v} />}
          <FyCard v={v} />
        </div>
      </div>
    </>
  );
}

function TermsCard({ v }: { v: VendorDetail }) {
  const unit = v.billing_model === "per_seat" ? "per seat per month" : v.billing_model === "usage" ? "per unit" : "per month";
  return (
    <Card title="Contract terms">
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Contract">{v.contract_id}</Field>
        <Field label="Start date">{formatDate(v.start_date)}</Field>
        <Field label="End date">{formatDate(v.end_date)}</Field>
        <Field label="Auto-renew">{v.auto_renew ? "Yes" : "No"}</Field>
        <Field label="Notice period">{v.notice_days} days</Field>
        <Field label="Decision deadline">{formatDate(v.decision_deadline)}</Field>
        <Field label="Billing model">{humanize(v.billing_model)}</Field>
        <Field label={`Unit price (${unit})`}>{formatBrlCents(v.unit_price)}</Field>
        <Field label="Seats contracted">{v.seats_contracted ?? "—"}</Field>
        <Field label="Annual value">{formatBrlFull(v.annual_value)}</Field>
        <Field label="Price escalator">{v.price_escalator_pct.toFixed(1)}% per renewal</Field>
        <Field label="Termination fee">{formatBrlFull(v.termination_fee)}</Field>
      </dl>
    </Card>
  );
}

function SeatChart({ vendorId, utilization }: { vendorId: string; utilization: number | null }) {
  const { data } = useSuspenseQuery(seatsQuery(vendorId));
  if (data.length === 0) return <p className="mt-4 text-sm text-muted-foreground">No seat history.</p>;
  const label = (iso: string) => { const p = dateParts(iso); return `${p.month} ${p.year.slice(2)}`; };
  return (
    <>
      <p className="mt-1 text-sm text-muted-foreground">
        {utilization !== null ? `Last 3 months: ${formatPercent(utilization)} of seats used` : "Active vs. contracted seats by month"}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 text-xs text-muted-foreground" aria-hidden="true">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-forest" />Active seats</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-sage" />Contracted seats</span>
      </div>
      <div className="mt-2 h-56" role="img" aria-label={`Active versus contracted seats; last 3 months ${utilization !== null ? formatPercent(utilization) : "unknown"} used`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="month" tickFormatter={label} tick={{ fontSize: 11 }} minTickGap={18} />
            <YAxis tick={{ fontSize: 11 }} width={44} domain={[0, "auto"]} label={{ value: "Seats", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Tooltip labelFormatter={(l: string) => label(l)} formatter={(v: number, n: string) => [v, n === "seats_active" ? "Active" : "Contracted"]} />
            <Line type="stepAfter" dataKey="seats_contracted" stroke="var(--sage)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="seats_active" stroke="var(--forest)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function BenchmarkCard({ v }: { v: VendorDetail }) {
  const cmp = v.price_vs_benchmark_pct !== null ? benchmarkComparison(v.price_vs_benchmark_pct) : null;
  return (
    <Card title="Price vs. public benchmark">
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Field label="Our price per seat">{formatBrlCents(v.unit_price)}</Field>
        <Field label="Public list price">{v.benchmark_price_per_seat !== null ? formatBrlCents(v.benchmark_price_per_seat) : "—"}</Field>
      </dl>
      {cmp && (
        <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${cmp.above ? "text-bronze" : "text-forest"}`}>
          {cmp.above && <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {cmp.text}
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Source:{" "}
        {v.benchmark_source_url ? (
          <a href={v.benchmark_source_url} target="_blank" rel="noreferrer" className={`${focusRing} inline-flex items-center gap-0.5 underline decoration-sage underline-offset-2 hover:text-forest`}>
            {v.benchmark_product}<ArrowUpRight className="h-3 w-3" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : v.benchmark_product}
        {v.benchmark_as_of && <>, list price as of {formatDate(v.benchmark_as_of)}</>}. Public list price; enterprise buyers usually pay less.
      </p>
    </Card>
  );
}

function RecommendationCard({ v }: { v: VendorDetail }) {
  return (
    <Card title="Recommendation">
      {v.recommendation ? (
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-medium text-forest">{v.recommendation}</p>
          {v.estimated_annual_impact !== null && (
            <p className="text-sm">
              Estimated annual impact <span className="font-medium tabular-nums text-forest">{formatBrlKpi(v.estimated_annual_impact)}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No decision in the current review window.</p>
      )}
      <p className="mt-3 text-sm text-foreground/85">{v.rule_explanation}</p>
    </Card>
  );
}

function FyCard({ v }: { v: VendorDetail }) {
  if (v.fy_landing === null && v.fy_budget === null) return null;
  const landing = v.fy_landing ?? 0;
  const budget = v.fy_budget ?? 0;
  const dir = budgetDirection(landing - budget);
  return (
    <Card title="Fiscal year">
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <Field label="Landing (actuals + forecast)">{formatBrlFull(landing)}</Field>
        <Field label="Budget">{budget === 0 ? "No budget line" : formatBrlFull(budget)}</Field>
      </dl>
      <p className="mt-3 text-sm">
        {budget === 0
          ? "Unbudgeted: all spend this year is outside the budget."
          : dir === "on"
            ? "On budget."
            : `${formatBrlKpi(Math.abs(landing - budget))} ${dir} budget.`}
      </p>
    </Card>
  );
}
