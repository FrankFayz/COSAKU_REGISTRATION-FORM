import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, asList } from "../../api";
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
        setEvents(asList<EventItem>(e).slice(0, 6));
        setRecent(asList<RegistrationItem>(r));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Events", value: stats.events },
        { label: "Upcoming", value: stats.upcoming },
        { label: "Registered", value: stats.registrations },
        { label: "Present", value: stats.attended },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">Overview</h1>
        <Link to="/admin/events/new" className="btn-gold px-4 py-2 text-sm uppercase tracking-[0.1em]">
          New event
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-mute">Loading…</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-mute">{card.label}</p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-kab">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e6eaed] px-4 py-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-kab">Events</h2>
            <Link to="/admin/events" className="text-sm text-kab">
              View all
            </Link>
          </div>
          <ul>
            {events.map((event) => (
              <li key={event.id} className="border-t border-[#e6eaed] first:border-t-0">
                <Link to={`/admin/events/${event.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <p className="font-medium text-ink">{event.title}</p>
                    <p className="text-sm text-mute">
                      {formatDay(event.starts_at)} · {event.taken} registered
                    </p>
                  </span>
                  <span className={`status-pill ${event.is_closed ? "status-closed" : "status-open"}`}>
                    {event.is_closed ? "Closed" : "Open"}
                  </span>
                </Link>
              </li>
            ))}
            {!loading && events.length === 0 ? <p className="px-4 py-6 text-sm text-mute">No events yet.</p> : null}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <h2 className="border-b border-[#e6eaed] px-4 py-3 font-[family-name:var(--font-display)] text-xl font-bold text-kab">
            Latest registrations
          </h2>
          <ul>
            {recent.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 border-t border-[#e6eaed] px-4 py-3 first:border-t-0">
                <div>
                  <p className="font-medium text-ink">{row.full_name}</p>
                  <p className="text-sm text-mute">{row.event_title}</p>
                </div>
                <p className="text-xs text-mute">{formatDay(row.created_at)}</p>
              </li>
            ))}
            {!loading && recent.length === 0 ? <p className="px-4 py-6 text-sm text-mute">No registrations yet.</p> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
