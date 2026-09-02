import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { EventItem, RegistrationItem, Stats } from "../../types";
import { formatDay } from "../../utils";

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recent, setRecent] = useState<RegistrationItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<Stats>("/api/admin/stats/"),
      api<EventItem[]>("/api/admin/events/"),
      api<RegistrationItem[]>("/api/admin/recent/"),
    ])
      .then(([s, e, r]) => {
        setStats(s);
        setEvents(e.slice(0, 6));
        setRecent(r);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Events", value: stats.events },
        { label: "Upcoming", value: stats.upcoming },
        { label: "Registrations", value: stats.registrations },
        { label: "Marked present", value: stats.attended },
      ]
    : [];

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-blue">Executive desk</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-navy sm:text-4xl">Overview</h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-mute">Loading the desk…</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mute">{card.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">Events</h2>
            <Link to="/admin/events/new" className="text-sm text-blue">
              New event
            </Link>
          </div>
          <ul className="mt-4 grid gap-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link to={`/admin/events/${event.id}`} className="block bg-cream px-4 py-3">
                  <p className="font-medium text-navy">{event.title}</p>
                  <p className="text-sm text-mute">
                    {formatDay(event.starts_at)} · {event.taken} registered
                    {event.capacity ? ` / ${event.capacity}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">Latest names</h2>
          <ul className="mt-4 grid gap-3">
            {recent.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 bg-cream px-4 py-3">
                <div>
                  <p className="font-medium text-navy">{row.full_name}</p>
                  <p className="text-sm text-mute">{row.event_title}</p>
                </div>
                <p className="text-xs text-mute">{formatDay(row.created_at)}</p>
              </li>
            ))}
            {!loading && recent.length === 0 ? <p className="text-sm text-mute">No registrations yet.</p> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
