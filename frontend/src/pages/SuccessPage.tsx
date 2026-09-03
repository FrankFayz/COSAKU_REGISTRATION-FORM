import { Link, useSearchParams } from "react-router-dom";
import { PageShell } from "../components/Brand";
import type { RegistrationItem } from "../types";
import { formatClock, formatDay } from "../utils";

export function SuccessPage() {
  const [params] = useSearchParams();
  const raw = sessionStorage.getItem("cosaku_last_registration");
  const registration = raw ? (JSON.parse(raw) as RegistrationItem) : null;

  if (!registration || (params.get("id") && String(registration.id) !== params.get("id"))) {
    return (
      <PageShell>
        <main className="page-wrap">
          <h1 className="form-title">Registered</h1>
          <Link to="/register" className="btn-gold mt-6 inline-block px-6 py-3 text-sm uppercase tracking-[0.12em]">
            Register
          </Link>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="page-wrap">
        <section className="form-card text-center">
          <p className="form-kicker">You're registered</p>
          <h1 className="form-title">{registration.full_name}</h1>
          <p className="form-lead mt-3">{registration.event_title}</p>
          <p className="form-kicker mt-5">Moving technology to another level</p>
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
      </main>
    </PageShell>
  );
}
