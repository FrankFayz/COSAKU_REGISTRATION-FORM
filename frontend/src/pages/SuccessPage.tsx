import { Link, useSearchParams } from "react-router-dom";
import { PageShell } from "../components/Brand";
import type { RegistrationItem } from "../types";
import { formatClock, formatLongDay } from "../utils";

export function SuccessPage() {
  const [params] = useSearchParams();
  const raw = sessionStorage.getItem("cosaku_last_registration");
  const registration = raw ? (JSON.parse(raw) as RegistrationItem) : null;

  if (!registration || (params.get("id") && String(registration.id) !== params.get("id"))) {
    return (
      <PageShell>
        <main className="page-wrap">
          <section className="confirm-card">
            <p className="confirm-stamp is-empty">Confirmation</p>
            <h1 className="confirm-name">No registration found</h1>
            <p className="confirm-lead">
              This page only shows a confirmation after you submit the COSAKU form on this device.
            </p>
            <Link to="/register" className="btn-gold confirm-action">
              Go to registration
            </Link>
          </section>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="page-wrap">
        <section className="confirm-card">
          <p className="confirm-stamp">Registered</p>
          <h1 className="confirm-name">Thank you, {registration.full_name}</h1>
          <p className="confirm-lead">
            You have registered for {registration.event_title}. COSAKU is glad to have you at this event,
            and we look forward to seeing you.
          </p>

          <dl className="confirm-sheet">
            <div>
              <dt>Event</dt>
              <dd>{registration.event_title}</dd>
            </div>
            {registration.starts_at ? (
              <div>
                <dt>Date</dt>
                <dd>{formatLongDay(registration.starts_at)}</dd>
              </div>
            ) : null}
            {registration.starts_at ? (
              <div>
                <dt>Time</dt>
                <dd>{formatClock(registration.starts_at)}</dd>
              </div>
            ) : null}
            {registration.venue ? (
              <div>
                <dt>Venue</dt>
                <dd>{registration.venue}</dd>
              </div>
            ) : null}
            <div>
              <dt>Kab email</dt>
              <dd>{registration.kab_email}</dd>
            </div>
          </dl>

          <p className="confirm-motto">Moving technology to another level</p>
          <Link to="/register" className="btn-blue confirm-action">
            Done
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
