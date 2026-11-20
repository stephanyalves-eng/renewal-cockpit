import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/vendors/$vendorId")({
  head: () => ({
    meta: [
      { title: "Vendor detail · Renewal Cockpit" },
      { name: "description", content: "Contracts, spend history and renewal terms for a single vendor." },
      { property: "og:title", content: "Vendor detail · Renewal Cockpit" },
      { property: "og:description", content: "Contracts, spend history and renewal terms for a single vendor." },
    ],
  }),
  component: Page,
});

function Page() {
  const { vendorId } = Route.useParams();
  return (
    <PageShell
      eyebrow={`Vendor · ${vendorId}`}
      title="Vendor detail"
      description="Contracts, spend history and renewal terms for a single vendor."
      emptyTitle="No vendor data yet"
      emptyBody="Contracts and spend for this vendor appear here once the data source is connected."
    />
  );
}
