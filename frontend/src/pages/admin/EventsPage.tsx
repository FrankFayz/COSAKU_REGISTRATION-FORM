import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { EventItem } from "../../types";
import { formatDay } from "../../utils";

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<EventItem[]>("/api/admin/events/")
      .then(setEvents)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-blue">Catalogue</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">Events</h1>
        </div>
        <Link to="/admin/events/new" className="btn-gold px-5 py-3 text-sm uppercase tracking-[0.14em]">
          Create event
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <div className="card mt-6 overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">List</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-navy/10">
                <td className="px-4 py-3">
                  <Link to={`/admin/events/${event.id}`} className="font-medium text-navy">
                    {event.title}
                  </Link>
                  <p className="text-xs text-mute">{event.venue}</p>
                </td>
                <td className="px-4 py-3">{formatDay(event.starts_at)}</td>
                <td className="px-4 py-3">
                  {event.taken}
                  {event.capacity ? ` / ${event.capacity}` : ""}
                </td>
                <td className="px-4 py-3">
                  {event.is_closed ? "Closed" : event.is_published ? "Open" : "Hidden"}
                  {event.is_featured ? " · featured" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
