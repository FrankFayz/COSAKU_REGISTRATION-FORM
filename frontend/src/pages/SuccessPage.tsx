import { Link, useSearchParams } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/Brand";
import type { RegistrationItem } from "../types";
import { formatClock, formatDay } from "../utils";

export function SuccessPage() {
  const [params] = useSearchParams();
  const raw = sessionStorage.getItem("cosaku_last_registration");
  const registration = raw ? (JSON.parse(raw) as RegistrationItem) : null;

  if (!registration || (params.get("id") && String(registration.id) !== params.get("id"))) {
    return (
      <div className="min-h-svh bg-cream">
        <PublicHeader />
        <main className="mx-auto max-w-xl px-5 py-10">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-navy">Registered</h1>
          <Link to="/register" className="btn-gold mt-6 inline-block px-6 py-3 text-sm">
            Register
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-cream">
      <PublicHeader />
      <main className="mx-auto max-w-xl px-5 py-8 sm:py-10">
        <section className="card p-6 text-center sm:p-8">
          <p className="text-sm font-medium text-green">Registered</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy sm:text-4xl">{registration.event_title}</h1>
          <p className="mt-6 text-lg font-semibold tracking-wide text-navy sm:text-xl">{registration.kab_email}</p>
          <p className="mt-2 text-sm text-mute">
            {registration.starts_at ? `${formatDay(registration.starts_at)} · ${formatClock(registration.starts_at)}` : ""}
            {registration.venue ? ` · ${registration.venue}` : ""}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-blue px-5 py-2.5 text-sm">
              Another event
            </Link>
            <Link to="/" className="px-5 py-2.5 text-sm text-navy">
              Home
            </Link>
          </div>
        </section>
        <PublicFooter />
      </main>
    </div>
  );
}
