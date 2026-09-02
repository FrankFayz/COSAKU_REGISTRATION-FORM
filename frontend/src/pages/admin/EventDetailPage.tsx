import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiUrl, getToken } from "../../api";
import type { EventItem, RegistrationItem } from "../../types";
import { formatWhen } from "../../utils";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;
    const data = await api<EventItem>(`/api/admin/events/${id}/`);
    setEvent(data);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [id]);

  const rows = event?.registrations ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.full_name, row.kab_email, row.phone, row.programme, row.year_of_study].join(" ").toLowerCase().includes(needle),
    );
  }, [query, rows]);

  const present = rows.filter((row) => row.attended).length;

  async function toggle(row: RegistrationItem) {
    await api(`/api/admin/registrations/${row.id}/attendance/`, { method: "POST" });
    await load();
  }

  async function removeEvent() {
    if (!id || !window.confirm("Delete this event and its registrations?")) return;
    await api(`/api/admin/events/${id}/`, { method: "DELETE" });
    navigate("/admin/events");
  }

  async function downloadCsv() {
    const token = getToken();
    const response = await fetch(apiUrl(`/api/admin/events/${id}/csv/`), {
      headers: token ? { Authorization: `Token ${token}` } : {},
    });
    if (!response.ok) {
      setError("Could not download CSV.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `COSAKU-${event?.slug ?? "event"}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!event) {
    return <p className="text-mute">{error || "Loading…"}</p>;
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-blue">{event.venue}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">{event.title}</h1>
      <p className="mt-2 text-sm text-mute">{formatWhen(event.starts_at)}</p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/80">{event.description}</p>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="no-print mt-6 flex flex-wrap gap-3">
        <Link to={`/admin/events/${event.id}/edit`} className="btn-blue px-4 py-2 text-sm">
          Edit event
        </Link>
        <button type="button" className="btn-gold px-4 py-2 text-sm" onClick={downloadCsv}>
          Download CSV
        </button>
        <button type="button" className="bg-navy/10 px-4 py-2 text-sm text-navy" onClick={() => window.print()}>
          Print door list
        </button>
        <button type="button" className="px-4 py-2 text-sm text-red-700" onClick={removeEvent}>
          Delete
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Registered</p>
          <p className="mt-1 text-3xl text-navy">{rows.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Present</p>
          <p className="mt-1 text-3xl text-navy">{present}</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Capacity</p>
          <p className="mt-1 text-3xl text-navy">{event.capacity ?? "Open"}</p>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="no-print border-b border-navy/10 p-4">
          <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, Kab email, WhatsApp…" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Kab Email</th>
                <th className="px-4 py-3 font-medium">WhatsApp number</th>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="no-print px-4 py-3 font-medium">Door</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-navy/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{row.full_name}</p>
                    {row.extra_answer ? <p className="text-xs text-mute">{row.extra_answer}</p> : null}
                  </td>
                  <td className="px-4 py-3">{row.kab_email}</td>
                  <td className="px-4 py-3">{row.phone}</td>
                  <td className="px-4 py-3">{row.programme}</td>
                  <td className="px-4 py-3">{row.year_of_study}</td>
                  <td className="no-print px-4 py-3">
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-semibold ${row.attended ? "bg-green text-white" : "bg-navy/10 text-navy"}`}
                      onClick={() => toggle(row)}
                    >
                      {row.attended ? "Present" : "Mark"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-mute" colSpan={6}>
                    No matching students.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
