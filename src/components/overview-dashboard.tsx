import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Minus, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { QuerySection } from "@/components/query-section";
import { formatBrlCompact } from "@/lib/money";
import { buildLandingSentence, formatPercent, getLargestOverrunCategory } from "@/lib/overview-format";
import { getCategoryLanding, getOverviewKpis } from "@/lib/overview.functions";
import type { CategoryLanding, OverviewKpis } from "@/lib/overview.types";

export const overviewKpisQueryOptions = queryOptions({
  queryKey: ["overview", "kpis"],
  queryFn: () => getOverviewKpis(),
});

export const categoryLandingQueryOptions = queryOptions({
  queryKey: ["overview", "category-landing"],
  queryFn: () => getCategoryLanding(),
});

function KpiCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="surface flex h-full flex-col px-5 py-5">
      <h2 className="eyebrow text-muted-foreground">{title}</h2>
      {children}
    </article>
  );
}

function BudgetVariance({ kpis }: { kpis: OverviewKpis }) {
  const variance = kpis.landing_vs_budget;
  const Icon = variance > 0 ? ArrowUp : variance < 0 ? ArrowDown : Minus;
  const direction = variance > 0 ? "Over" : variance < 0 ? "Under" : "On";

  return (
    <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-forest">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {variance === 0 ? (
        <span>On budget</span>
      ) : (
        <span>
          {direction} {formatBrlCompact(Math.abs(variance))} ({formatPercent(Math.abs(kpis.landing_vs_budget_pct))})
        </span>
      )}
    </div>
  );
}

function KpiStrip() {
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);

  return (
    <section aria-label="Fiscal year key figures" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="FY landing vs. budget">
        <p className="mt-5 text-3xl font-medium tracking-tight text-forest">{formatBrlCompact(kpis.fy_landing)}</p>
        <p className="mt-1 text-sm text-muted-foreground">FY {kpis.fiscal_year} landing</p>
        <p className="mt-4 text-sm text-muted-foreground">FY budget {formatBrlCompact(kpis.fy_budget)}</p>
        <BudgetVariance kpis={kpis} />
      </KpiCard>

      <KpiCard title="Savings YTD">
        <div className="mt-5 grid flex-1 grid-cols-2 gap-5">
          <div>
            <p className="text-2xl font-medium tracking-tight text-forest">{formatBrlCompact(kpis.savings_ytd)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Saving</p>
          </div>
          <div>
            <p className="text-2xl font-medium tracking-tight text-forest">
              {formatBrlCompact(kpis.cost_avoidance_ytd)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Cost avoidance</p>
          </div>
        </div>
      </KpiCard>

      <KpiCard title="Renewals in 90 days">
        <p className="mt-5 text-3xl font-medium tracking-tight text-forest">{kpis.renewals_next_90_days}</p>
        <p className="mt-1 text-sm text-muted-foreground">Upcoming renewals</p>
        <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-medium text-forest">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          <span>{kpis.urgent_decisions} urgent</span>
        </div>
      </KpiCard>

      <KpiCard title="Value at risk of auto-renewal">
        <p className="mt-5 text-3xl font-medium tracking-tight text-forest">
          {formatBrlCompact(kpis.value_at_risk_auto_renewal)}
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Auto-renewing contracts with a recommendation other than renew
        </p>
      </KpiCard>
    </section>
  );
}

function KpiStripSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading key figures" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="surface h-56 animate-pulse px-5 py-5">
          <div className="h-3 w-32 bg-muted" />
          <div className="mt-6 h-8 w-36 bg-muted" />
          <div className="mt-4 h-4 w-28 bg-muted" />
          <div className="mt-8 h-4 w-40 bg-muted" />
        </div>
      ))}
    </div>
  );
}

function axisMaximum(rows: CategoryLanding[]): number {
  const largest = Math.max(...rows.flatMap((row) => [row.landing, row.budget_fy]));
  return Math.max(1_000_000, Math.ceil(largest / 1_000_000) * 1_000_000);
}

function CategoryChart({ rows }: { rows: CategoryLanding[] }) {
  if (rows.length === 0) {
    return <p className="mt-8 text-sm text-muted-foreground">No category figures are available.</p>;
  }

  const maximum = axisMaximum(rows);
  const largestOverrun = getLargestOverrunCategory(rows);
  const gridColumns =
    "grid grid-cols-[minmax(6.5rem,10rem)_minmax(0,1fr)_3.5rem] sm:grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)_5rem]";

  return (
    <figure className="mt-6">
      <figcaption className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-2 w-4 bg-sage" aria-hidden="true" /> Landing
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-px bg-forest" aria-hidden="true" /> FY budget
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-4 bg-bronze" aria-hidden="true" /> Largest overrun
        </span>
      </figcaption>

      <div className="mt-5" role="img" aria-label="Horizontal bars show fiscal year landing by category, with fiscal year budget reference marks.">
        {rows.map((row) => {
          const isLargestOverrun = row.category === largestOverrun;
          return (
            <div key={row.category} className={`${gridColumns} min-h-14 items-center border-t border-border py-2`}>
              <div className="pr-3 text-sm leading-5 text-foreground">{row.category}</div>
              <div className="relative h-8 border-l border-forest/40" aria-hidden="true">
                <div
                  className={`absolute inset-y-1 left-0 ${isLargestOverrun ? "bg-bronze" : "bg-sage"}`}
                  style={{ width: `${(row.landing / maximum) * 100}%` }}
                />
                <div
                  className="absolute -inset-y-1 w-px bg-forest"
                  style={{ left: `${(row.budget_fy / maximum) * 100}%` }}
                />
              </div>
              <div className="pl-2 text-right text-sm font-medium text-foreground">
                {formatPercent(row.landing_vs_budget_pct, true)}
              </div>
            </div>
          );
        })}

        <div className={`${gridColumns} border-t border-border pt-2 text-xs text-muted-foreground`} aria-hidden="true">
          <div />
          <div className="relative h-5 border-l border-forest/40">
            <span className="absolute left-0">0</span>
            <span className="absolute left-1/2 -translate-x-1/2">{(maximum / 2_000_000).toFixed(1)}</span>
            <span className="absolute right-0">{(maximum / 1_000_000).toFixed(1)}</span>
          </div>
          <div />
        </div>
        <div className={`${gridColumns} text-xs text-muted-foreground`} aria-hidden="true">
          <div />
          <div className="pt-1 text-center">BRL million</div>
          <div />
        </div>
      </div>

      <ul className="sr-only">
        {rows.map((row) => (
          <li key={row.category}>
            {row.category}: landing {formatBrlCompact(row.landing)}, budget {formatBrlCompact(row.budget_fy)}, variance {formatPercent(row.landing_vs_budget_pct, true)}.
          </li>
        ))}
      </ul>
    </figure>
  );
}

function ChartSkeleton() {
  return (
    <div className="mt-6 animate-pulse" aria-label="Loading category chart" aria-busy="true">
      <div className="h-4 w-64 max-w-full bg-muted" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="mt-4 grid grid-cols-[8rem_1fr] items-center gap-4 border-t border-border pt-4">
          <div className="h-4 w-24 bg-muted" />
          <div className="h-6 bg-muted" />
        </div>
      ))}
    </div>
  );
}

function CategoryChartAndSentence() {
  const { data: rows } = useSuspenseQuery(categoryLandingQueryOptions);
  const { data: kpis } = useSuspenseQuery(overviewKpisQueryOptions);

  return (
    <>
      <CategoryChart rows={rows} />
      <p className="mt-7 border-t border-border pt-5 text-base text-foreground/80">{buildLandingSentence(kpis)}</p>
    </>
  );
}

export function OverviewDashboard() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="eyebrow text-muted-foreground">Overview</p>
      <h1 className="page-title mt-2 text-4xl sm:text-5xl">Renewal cockpit</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">
        A fiscal-year view of budget, upcoming renewal decisions and savings opportunities.
      </p>

      <QuerySection fallback={<KpiStripSkeleton />} errorTitle="Key figures couldn't load">
        <KpiStrip />
      </QuerySection>

      <section className="surface mt-8 px-4 py-6 sm:px-6" aria-labelledby="category-chart-title">
        <p className="eyebrow text-muted-foreground">Budget performance</p>
        <h2 id="category-chart-title" className="mt-2 text-2xl font-normal">
          Landing vs. budget by category
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Fiscal year landing against the full-year budget.</p>
        <QuerySection fallback={<ChartSkeleton />} errorTitle="The category chart couldn't load">
          <CategoryChartAndSentence />
        </QuerySection>
      </section>
    </main>
  );
}
