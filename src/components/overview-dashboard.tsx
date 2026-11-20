import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Minus, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { QuerySection } from "@/components/query-section";
import { formatBrlKpi } from "@/lib/money";
import { budgetDirection, dateParts, formatDate, formatPercent, getLargestOverrunCategory } from "@/lib/overview-format";
import { getCategoryLanding, getOverviewKpis, getUrgentRenewals } from "@/lib/overview.functions";
import type { CategoryLanding, OverviewKpis } from "@/lib/overview.types";

export const overviewKpisQueryOptions = queryOptions({
  queryKey: ["overview", "kpis"],
  queryFn: () => getOverviewKpis(),
});

export const categoryLandingQueryOptions = queryOptions({
  queryKey: ["overview", "category-landing"],
  queryFn: () => getCategoryLanding(),
});

export const urgentRenewalsQueryOptions = queryOptions({
  queryKey: ["overview", "urgent-renewals"],
  queryFn: () => getUrgentRenewals(),
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

/** Splits "BRL 18.51M" into a small currency prefix and the figure. */
function Money({ value, className = "" }: { value: number; className?: string }) {
  const text = formatBrlKpi(value);
  const figure = text.replace("BRL ", "");
  return (
    <span className={`tabular-nums ${className}`}>
      <span className="mr-1 text-base font-medium">{text.startsWith("-") ? "-BRL" : "BRL"}</span>
      {figure.replace("-", "")}
    </span>
  );
}

/* ---------- Header ---------- */

function AsOfLabel() {
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);
  return (
    <p className="eyebrow text-forest">
      FY {kpis.fiscal_year} · As of {formatDate(kpis.anchor_date)}
    </p>
  );
}

/* ---------- KPI band ---------- */

function KpiBlock({ title, dark = false, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 px-5 py-5 ${dark ? "bg-forest text-ivory" : "bg-card"}`}>
      <h2 className={`text-sm font-medium ${dark ? "text-ivory" : "text-forest/80"}`}>{title}</h2>
      {children}
    </div>
  );
}

function VarianceLine({ kpis }: { kpis: OverviewKpis }) {
  const direction = budgetDirection(kpis.landing_vs_budget);
  if (direction === "on") return <p className="mt-2 text-sm font-medium text-forest">On budget</p>;
  const Icon = direction === "over" ? ArrowUp : ArrowDown;
  return (
    <p className={`mt-2 flex flex-wrap items-center gap-1 text-sm font-medium ${direction === "over" ? "text-bronze" : "text-forest"}`}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{direction === "over" ? "Over" : "Under"}:</span>
      <span>
        {formatBrlKpi(Math.abs(kpis.landing_vs_budget))} {direction} budget
      </span>
    </p>
  );
}

function KpiBand() {
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);
  const valueClass = "mt-3 block text-3xl font-medium tracking-tight";
  return (
    <section
      aria-label="Fiscal year key figures"
      className="surface mt-6 grid grid-cols-1 overflow-hidden divide-y divide-border min-[480px]:grid-cols-2 min-[480px]:divide-y-0 min-[480px]:gap-px min-[480px]:bg-border lg:grid-cols-[1.15fr_1fr_1fr_1fr]"
    >
      <KpiBlock title="FY landing" dark>
        <Money value={kpis.fy_landing} className={`${valueClass} text-ivory`} />
        <p className="mt-2 text-sm text-ivory/85">vs. {formatBrlKpi(kpis.fy_budget)} budget</p>
      </KpiBlock>
      <KpiBlock title="Budget variance">
        <span className={`${valueClass} tabular-nums text-forest`}>{formatPercent(kpis.landing_vs_budget_pct, true)}</span>
        <VarianceLine kpis={kpis} />
      </KpiBlock>
      <KpiBlock title="Auto-renewal exposure">
        <Money value={kpis.value_at_risk_auto_renewal} className={`${valueClass} text-forest`} />
        <p className="mt-2 text-sm text-muted-foreground">
          Auto-renewing contracts in the 120-day window with a recommendation other than renew
        </p>
      </KpiBlock>
      <KpiBlock title="Savings YTD">
        <Money value={kpis.savings_ytd} className={`${valueClass} text-forest`} />
        <p className="mt-2 text-sm text-muted-foreground">{formatBrlKpi(kpis.cost_avoidance_ytd)} cost avoidance</p>
      </KpiBlock>
    </section>
  );
}

function KpiBandSkeleton() {
  return (
    <div className="surface mt-6 grid animate-pulse grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading key figures">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-32 border-border px-5 py-5">
          <div className="h-3 w-24 bg-muted" />
          <div className="mt-4 h-8 w-32 bg-muted" />
          <div className="mt-3 h-3 w-40 bg-muted" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Chart ---------- */

function axisTicks(rows: CategoryLanding[]): number[] {
  const largest = Math.max(...rows.flatMap((r) => [r.landing, r.budget_fy])) / 1e6;
  const step = largest > 6 ? 2 : largest > 3 ? 1 : 0.5;
  const max = Math.max(step, Math.ceil(largest / step) * step);
  return Array.from({ length: Math.round(max / step) + 1 }, (_, i) => +(i * step).toFixed(1));
}

function SummaryLine({ row }: { row: CategoryLanding }) {
  const direction = budgetDirection(row.landing_vs_budget);
  const variance = direction === "on" ? "on budget" : `${formatBrlKpi(Math.abs(row.landing_vs_budget))} ${direction} budget`;
  return (
    <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground" aria-live="polite">
      <span className="font-medium text-forest">{row.category}</span> · {formatBrlKpi(row.landing)} landing /{" "}
      {formatBrlKpi(row.budget_fy).replace("BRL ", "")} budget · {variance}
    </p>
  );
}

function CategoryChart() {
  const { data: rows } = useSuspenseQuery(categoryLandingQueryOptions);
  const highlighted = getLargestOverrunCategory(rows);
  const [selected, setSelected] = useState<string | null>(null);

  if (rows.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No category data</p>;

  const current = rows.find((r) => r.category === selected) ?? rows.find((r) => r.category === highlighted) ?? rows[0]!;
  const ticks = axisTicks(rows);
  const max = (ticks[ticks.length - 1] ?? 1) * 1e6;
  const cols = "grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] gap-x-3 sm:grid-cols-[10rem_minmax(0,1fr)_4rem]";

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-2 w-4 bg-sage" aria-hidden="true" />Landing</span>
        <span className="flex items-center gap-2"><span className="h-3 w-0.5 bg-forest" aria-hidden="true" />FY budget</span>
      </div>

      <div role="radiogroup" aria-label="Select a category" className="mt-3">
        {rows.map((row) => {
          const isSelected = row.category === current.category;
          const isBronze = row.category === highlighted;
          return (
            <button
              key={row.category}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(row.category)}
              className={`${cols} ${focusRing} w-full items-center border-t border-border px-1 py-2.5 text-left ${isSelected ? "bg-secondary" : "hover:bg-muted"}`}
            >
              <span className="text-sm font-medium leading-5 text-foreground">{row.category}</span>
              <span className="relative h-3" aria-hidden="true">
                <span className={`absolute inset-y-0 left-0 ${isBronze ? "bg-bronze" : "bg-sage"}`} style={{ width: `${(row.landing / max) * 100}%` }} />
                <span className="absolute -inset-y-1.5 w-0.5 bg-forest" style={{ left: `${(row.budget_fy / max) * 100}%` }} />
              </span>
              <span className="text-right text-sm tabular-nums text-foreground">
                {formatPercent(row.landing_vs_budget_pct, true)}
                <span className="sr-only">
                  {" "}vs. budget{isBronze ? ", largest overrun" : ""}
                </span>
              </span>
            </button>
          );
        })}
        <div className={`${cols} border-t border-border px-1 pt-2 text-xs text-muted-foreground`} aria-hidden="true">
          <span />
          <span className="relative h-4">
            {ticks.map((t, i) => (
              <span
                key={t}
                className={`absolute tabular-nums ${i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${(t / (ticks[ticks.length - 1] ?? 1)) * 100}%` }}
              >
                {t}
              </span>
            ))}
          </span>
          <span />
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">BRL million</p>
      </div>

      <SummaryLine row={current} />
    </>
  );
}

function ChartSkeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-busy="true" aria-label="Loading category chart">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="mt-3 grid grid-cols-[8rem_1fr] gap-4 border-t border-border pt-3">
          <div className="h-4 bg-muted" />
          <div className="h-4 bg-muted" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Renewal decisions ---------- */

function DecisionsHeader() {
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);
  return (
    <>
      <span className="shrink-0 rounded-[2px] bg-bronze/15 px-2 py-1 text-sm font-medium text-bronze">
        {kpis.urgent_decisions} urgent
      </span>
    </>
  );
}

function DecisionsSubline() {
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);
  return <p className="mt-1 text-sm text-muted-foreground">{kpis.renewals_next_90_days} contracts end in the next 90 days</p>;
}

function DecisionList() {
  const { data: rows } = useSuspenseQuery(urgentRenewalsQueryOptions);
  const [open, setOpen] = useState<string | null>(null);

  if (rows.length === 0) return <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">No decisions due in the next 30 days.</p>;

  return (
    <ul className="mt-4">
      {rows.map((row) => {
        const d = dateParts(row.decision_deadline);
        const expanded = open === row.contract_id;
        const panelId = `decision-${row.contract_id}`;
        const Icon = expanded ? Minus : Plus;
        return (
          <li key={row.contract_id} className="border-t border-border">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpen(expanded ? null : row.contract_id)}
              className={`${focusRing} grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5 text-left hover:bg-muted`}
            >
              <span className="flex w-11 flex-col items-center rounded-[2px] bg-bronze/15 py-1 text-bronze">
                <span className="text-lg font-medium leading-tight tabular-nums">{d.day}</span>
                <span className="eyebrow text-[0.625rem]">{d.month}</span>
                <span className="sr-only"> {d.year}, decision deadline</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-forest">{row.vendor_name}</span>
                <span className="block text-sm text-muted-foreground">
                  {row.recommendation} · {row.auto_renew ? "Auto-renews" : "Manual renewal"}
                </span>
              </span>
              <Icon className="h-4 w-4 shrink-0 text-forest" aria-hidden="true" />
            </button>
            {expanded && (
              <div id={panelId} className="space-y-2 pb-4 pl-14 pr-2 text-sm text-foreground/85">
                {row.rationale && <p>{row.rationale}</p>}
                <p>
                  Estimated annual impact: <span className="font-medium tabular-nums">{formatBrlKpi(row.estimated_annual_impact)}</span>
                  <span className="text-muted-foreground"> (estimate for the {row.recommendation.toLowerCase()} recommendation)</span>
                </p>
                <p>Contract ends {formatDate(row.end_date)}</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LineSkeleton({ w = "w-40" }: { w?: string }) {
  return <div className={`mt-2 h-4 ${w} animate-pulse bg-muted`} aria-busy="true" />;
}

function ListSkeleton() {
  return (
    <div className="mt-4 animate-pulse" aria-busy="true" aria-label="Loading renewal decisions">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-3 border-t border-border py-3">
          <div className="h-11 w-11 bg-muted" />
          <div className="flex-1"><div className="h-4 w-32 bg-muted" /><div className="mt-2 h-3 w-40 bg-muted" /></div>
        </div>
      ))}
    </div>
  );
}

function RenewalDecisions() {
  return (
    <section className="surface px-5 py-5" aria-labelledby="decisions-title">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 id="decisions-title" className="text-xl font-normal">Renewal decisions</h2>
          <QuerySection fallback={<LineSkeleton />} errorTitle="Renewal counts couldn't load">
            <DecisionsSubline />
          </QuerySection>
        </div>
        <QuerySection fallback={<LineSkeleton w="w-16" />} errorTitle="Urgent count couldn't load">
          <DecisionsHeader />
        </QuerySection>
      </div>
      <QuerySection fallback={<ListSkeleton />} errorTitle="Renewal decisions couldn't load">
        <DecisionList />
      </QuerySection>
      <Link to="/renewals" className={`${focusRing} mt-4 block border-t border-border pt-4 text-sm font-medium text-forest underline-offset-4 hover:underline`}>
        View all renewals →
      </Link>
    </section>
  );
}

/* ---------- Page ---------- */

export function OverviewDashboard() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="page-title text-4xl sm:text-5xl">Renewal overview</h1>
        <QuerySection fallback={<LineSkeleton w="w-48" />} errorTitle="Fiscal year couldn't load">
          <AsOfLabel />
        </QuerySection>
      </div>

      <QuerySection fallback={<KpiBandSkeleton />} errorTitle="Key figures couldn't load">
        <KpiBand />
      </QuerySection>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="lg:order-2">
          <RenewalDecisions />
        </div>
        <section className="surface px-5 py-5 lg:order-1" aria-labelledby="category-chart-title">
          <h2 id="category-chart-title" className="text-xl font-normal">Landing vs. budget by category</h2>
          <p className="mt-1 text-sm text-muted-foreground">FY forecast and budget · BRL million</p>
          <QuerySection fallback={<ChartSkeleton />} errorTitle="The category chart couldn't load">
            <CategoryChart />
          </QuerySection>
        </section>
      </div>
    </main>
  );
}
