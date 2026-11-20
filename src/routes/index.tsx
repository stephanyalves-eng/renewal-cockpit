import { createFileRoute } from "@tanstack/react-router";
import {
  categoryLandingQueryOptions,
  kpisByCategoryQueryOptions,
  OverviewDashboard,
  overviewKpisQueryOptions,
  urgentRenewalsQueryOptions,
} from "@/components/overview-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Renewal overview · Renewal Cockpit" },
      { name: "description", content: "A fiscal-year view of budget, upcoming renewal decisions and savings opportunities." },
      { property: "og:title", content: "Renewal overview · Renewal Cockpit" },
      { property: "og:description", content: "A fiscal-year view of budget, upcoming renewal decisions and savings opportunities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(overviewKpisQueryOptions);
    void context.queryClient.prefetchQuery(categoryLandingQueryOptions);
    void context.queryClient.prefetchQuery(kpisByCategoryQueryOptions);
    void context.queryClient.prefetchQuery(urgentRenewalsQueryOptions);
  },
  component: Page,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-6xl px-4 py-16" role="alert">
      <h1 className="page-title text-4xl">The Overview page couldn't load</h1>
      <p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
    </main>
  ),
  notFoundComponent: () => <main className="mx-auto max-w-6xl px-4 py-16">Overview not found.</main>,
});

function Page() {
  return <OverviewDashboard />;
}
