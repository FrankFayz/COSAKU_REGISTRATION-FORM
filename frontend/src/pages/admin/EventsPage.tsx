import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, asList } from "../../api";
import type { EventItem } from "../../types";
import { formatDay } from "../../utils";

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const data = await api<EventItem[] | { results?: EventItem[] }>("/api/admin/events/");
    setEvents(asList<EventItem>(data));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function setDesk(event: EventItem, open: boolean) {
    if (open) {
      const ok = window.confirm(
        "COSAKU runs one registration desk at a time. Opening this event will stop registration on any other open event.",
      );
      if (!ok) return;
    } else {
      const ok = window.confirm("Stop registration for this event? Students will no longer be able to join.");
      if (!ok) return;
    }
    setBusyId(event.id);
    setError("");
    try {
      await api(`/api/admin/events/${event.id}/desk/`, { method: "POST", json: { open } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update registration.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">Events</h1>
          <p className="mt-1 text-sm text-mute">One event can take registrations at a time.</p>
        </div>
        <Link to="/admin/events/new" className="btn-gold px-4 py-2 text-sm uppercase tracking-[0.1em]">
          New event
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Venue</th>
              <th>When</th>
              <th>Registered</th>
              <th>Registration</th>
              <th className="no-print">Desk</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const open = !event.is_closed;
              return (
                <tr key={event.id}>
                  <td>
                    <Link to={`/admin/events/${event.id}`} className="font-medium text-kab">
                      {event.title}
                    </Link>
                  </td>
                  <td>{event.venue}</td>
                  <td>{formatDay(event.starts_at)}</td>
                  <td>{event.taken}</td>
                  <td>
                    <span className={`status-pill ${open ? "status-open" : "status-closed"}`}>
                      {open ? "Open" : "Stopped"}
                    </span>
                  </td>
                  <td className="no-print">
                    {open ? (
                      <button
                        type="button"
                        className="btn-stop px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em]"
                        disabled={busyId === event.id}
                        onClick={() => setDesk(event, false)}
                      >
                        {busyId === event.id ? "Saving…" : "Stop"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-blue px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em]"
                        disabled={busyId === event.id}
                        onClick={() => setDesk(event, true)}
                      >
                        {busyId === event.id ? "Saving…" : "Open"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {events.length === 0 ? (
              <tr>
                <td className="py-10 text-center text-mute" colSpan={6}>
                  No events yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
