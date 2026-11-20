import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExportButton } from "@/components/export-button";
import { QuerySection } from "@/components/query-section";
import type { ExportColumn } from "@/lib/export-excel";
import { humanize } from "@/lib/vendor-format";
import { getVendorList } from "@/lib/vendors.functions";
import type { VendorListRow } from "@/lib/vendors.types";

const vendorExportColumns: ExportColumn<VendorListRow>[] = [
  { header: "Vendor", value: (v) => v.vendor_name },
  { header: "Category", value: (v) => v.category },
  { header: "Status", value: (v) => humanize(v.status) },
  { header: "Recommendation", value: (v) => v.recommendation ?? "No decision due" },
];

const vendorListQuery = queryOptions({ queryKey: ["vendors"], queryFn: () => getVendorList() });
const DESCRIPTION = "Every vendor with its category, contract status and current renewal recommendation.";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors · Renewal Cockpit" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Vendors · Renewal Cockpit" },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(vendorListQuery);
  },
  component: Page,
});

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10">
      <p className="eyebrow text-muted-foreground">Vendors</p>
      <h1 className="page-title mt-2 text-4xl sm:text-5xl">Vendors</h1>
      <p className="mt-3 max-w-2xl text-base text-foreground/80">{DESCRIPTION}</p>
      <QuerySection fallback={<div className="mt-8 h-96 animate-pulse bg-muted" aria-busy="true" aria-label="Loading vendors" />} errorTitle="The vendor list couldn't load">
        <VendorList />
      </QuerySection>
    </main>
  );
}

function VendorList() {
  const { data } = useSuspenseQuery(vendorListQuery);
  if (data.length === 0) return <p className="mt-8 text-sm text-muted-foreground">No vendors.</p>;
  return (
    <>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{data.length} vendors</p>
      <ExportButton page="vendors" columns={vendorExportColumns} rows={data} />
    </div>
    <div className="surface mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Vendors ({data.length})</caption>
        <thead className="eyebrow text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-4 py-3 font-normal">Vendor</th>
            <th className="px-4 py-3 font-normal">Category</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {data.map((v) => (
            <tr key={v.vendor_id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-medium">
                <Link to="/vendors/$vendorId" params={{ vendorId: v.vendor_id }} className={`${focusRing} text-forest underline decoration-sage underline-offset-2`}>
                  {v.vendor_name}
                </Link>
              </td>
              <td className="px-4 py-2.5">{v.category}</td>
              <td className="px-4 py-2.5">{humanize(v.status)}</td>
              <td className="px-4 py-2.5">{v.recommendation ?? <span className="text-muted-foreground">No decision due</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
