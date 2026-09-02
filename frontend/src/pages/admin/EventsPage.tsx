import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, asList } from "../../api";
import type { EventItem } from "../../types";
import { formatDay } from "../../utils";

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<EventItem[] | { results?: EventItem[] }>("/api/admin/events/")
      .then((data) => setEvents(asList<EventItem>(data)))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">Events</h1>
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
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
                  <span className={`status-pill ${event.is_closed ? "status-closed" : "status-open"}`}>
                    {event.is_closed ? "Closed" : "Open"}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr>
                <td className="py-10 text-center text-mute" colSpan={5}>
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
