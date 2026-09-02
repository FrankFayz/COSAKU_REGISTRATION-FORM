import { Link, useSearchParams } from "react-router-dom";
import { PublicFooter, SiteHeader } from "../components/Brand";
import type { RegistrationItem } from "../types";
import { formatClock, formatDay } from "../utils";

export function SuccessPage() {
  const [params] = useSearchParams();
  const raw = sessionStorage.getItem("cosaku_last_registration");
  const registration = raw ? (JSON.parse(raw) as RegistrationItem) : null;

  if (!registration || (params.get("id") && String(registration.id) !== params.get("id"))) {
    return (
      <div className="min-h-svh bg-cream">
        <SiteHeader />
        <main className="page-wrap">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">Registered</h1>
          <Link to="/register" className="btn-gold mt-6 inline-block px-6 py-3 text-sm uppercase tracking-[0.12em]">
            Register
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-cream">
      <SiteHeader />
      <main className="page-wrap">
        <section className="form-card text-center">
          <p className="text-sm font-medium text-green">Registered</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-kab">{registration.event_title}</h1>
          <p className="mt-6 text-lg font-semibold tracking-wide text-ink">{registration.kab_email}</p>
          <p className="mt-2 text-sm text-mute">
            {registration.starts_at ? `${formatDay(registration.starts_at)} · ${formatClock(registration.starts_at)}` : ""}
            {registration.venue ? ` · ${registration.venue}` : ""}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-blue px-5 py-2.5 text-sm">
              Another event
            </Link>
            <Link to="/" className="px-5 py-2.5 text-sm text-kab">
              Home
            </Link>
          </div>
        </section>
        <PublicFooter />
      </main>
    </div>
  );
}
