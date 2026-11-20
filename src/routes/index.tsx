import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Renewal cockpit · Renewal Cockpit" },
      { name: "description", content: "A fiscal-year view of budget, upcoming renewal decisions and savings opportunities." },
      { property: "og:title", content: "Renewal cockpit · Renewal Cockpit" },
      { property: "og:description", content: "A fiscal-year view of budget, upcoming renewal decisions and savings opportunities." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell eyebrow="Overview" title="Renewal cockpit" description="A fiscal-year view of budget, upcoming renewal decisions and savings opportunities." emptyTitle="Nothing to show yet" emptyBody="Figures appear here once the data source is connected." />
  );
}
