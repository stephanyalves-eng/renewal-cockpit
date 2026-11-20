import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Owner sign-in · Renewal Cockpit" },
      { name: "description", content: "Sign in as the owner to save contract status changes." },
      { property: "og:title", content: "Owner sign-in · Renewal Cockpit" },
      { property: "og:description", content: "Sign in as the owner to save contract status changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignIn,
});

const field = "mt-1 w-full rounded-[2px] border border-input bg-card px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-forest";

function SignIn() {
  const navigate = useNavigate();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError("Sign-in failed. Check the email and password.");
    void navigate({ to: "/renewals" });
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-10 sm:pt-14">
      <p className="eyebrow text-muted-foreground">Owner</p>
      <h1 className="page-title mt-2 text-4xl">Owner sign-in</h1>
      {session ? (
        <div className="surface mt-8 px-5 py-6 text-sm">
          <p>Signed in as {session.user.email}.</p>
          <button type="button" onClick={() => void supabase.auth.signOut()} className="mt-4 rounded-[2px] border border-input px-4 py-2 font-medium text-forest hover:bg-secondary">
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="surface mt-8 space-y-4 px-5 py-6">
          <label className="block text-sm font-medium">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-[2px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </main>
  );
}
