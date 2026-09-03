import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, asList } from "../../api";
import type { EventItem, Overview, PageResult, RegistrationItem, Stats } from "../../types";
import { formatDay } from "../../utils";

function applyRecent(
  data: PageResult<RegistrationItem> | RegistrationItem[],
  setRecent: (rows: RegistrationItem[]) => void,
  setCount: (n: number) => void,
  setPages: (n: number) => void,
) {
  if (Array.isArray(data)) {
    setRecent(data);
    setCount(data.length);
    setPages(1);
    return;
  }
  setRecent(asList<RegistrationItem>(data));
  setCount(data.count);
  setPages(Math.max(data.pages, 1));
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recent, setRecent] = useState<RegistrationItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [listBusy, setListBusy] = useState(false);
  const skipRecent = useRef(true);

  useEffect(() => {
    api<Overview>("/api/admin/overview/?page=1")
      .then((data) => {
        setStats(data.stats);
        setEvents(asList<EventItem>(data.events));
        applyRecent(data.recent, setRecent, setCount, setPages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (skipRecent.current) {
      skipRecent.current = false;
      return;
    }
    setListBusy(true);
    api<PageResult<RegistrationItem> | RegistrationItem[]>(`/api/admin/recent/?page=${page}`)
      .then((data) => applyRecent(data, setRecent, setCount, setPages))
      .catch((err: Error) => setError(err.message))
      .finally(() => setListBusy(false));
  }, [page]);

  const cards = stats
    ? [
        { label: "Events", value: stats.events },
        { label: "Upcoming", value: stats.upcoming },
        { label: "Registered", value: stats.registrations },
        { label: "Present", value: stats.attended },
      ]
    : [];

  const from = count === 0 ? 0 : (page - 1) * 10 + 1;
  const to = Math.min(page * 10, count);

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

      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="card stat-card">
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
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
                    {event.is_closed ? "Stopped" : "Open"}
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
            {!listBusy && recent.length === 0 ? <p className="px-4 py-6 text-sm text-mute">No registrations yet.</p> : null}
          </ul>
          {count > 10 ? (
            <div className="list-pager">
              <button type="button" className="btn-paper px-3 py-1.5 text-sm" disabled={page <= 1 || listBusy} onClick={() => setPage((current) => current - 1)}>
                Previous
              </button>
              <p>
                {from}–{to} of {count}
              </p>
              <button type="button" className="btn-paper px-3 py-1.5 text-sm" disabled={page >= pages || listBusy} onClick={() => setPage((current) => current + 1)}>
                Next
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
