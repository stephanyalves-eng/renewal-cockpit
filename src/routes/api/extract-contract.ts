import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/extract-contract")({
  server: {
    handlers: {
      POST: async ({ request }) => (await import("@/lib/intake-extract.server")).handleExtract(request),
    },
  },
});
