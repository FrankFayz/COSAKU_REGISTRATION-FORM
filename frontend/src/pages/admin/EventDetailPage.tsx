import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiUrl, getToken } from "../../api";
import { PieChart, countSlices } from "../../components/PieChart";
import type { EventItem, RegistrationItem } from "../../types";
import { formatWhen } from "../../utils";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [deskBusy, setDeskBusy] = useState(false);

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
      [row.full_name, row.gender, row.kab_email, row.phone, row.programme, row.year_of_study].join(" ").toLowerCase().includes(needle),
    );
  }, [query, rows]);

  const programmeSlices = useMemo(
    () => countSlices(rows.map((row) => row.programme)),
    [rows],
  );
  const yearSlices = useMemo(
    () => countSlices(rows.map((row) => row.year_of_study)),
    [rows],
  );
  const genderSlices = useMemo(() => {
    return countSlices(rows.map((row) => row.gender)).map((slice) => ({
      ...slice,
      color: slice.label === "Female" ? "#fdc854" : slice.label === "Male" ? "#0072bb" : "#7a7a7a",
    }));
  }, [rows]);

  async function setDesk(open: boolean) {
    if (!id) return;
    if (open) {
      const ok = window.confirm(
        "COSAKU runs one registration desk at a time. Opening this event will stop registration on any other open event.",
      );
      if (!ok) return;
    } else {
      const ok = window.confirm("Stop registration for this event? Students will no longer be able to join.");
      if (!ok) return;
    }
    setDeskBusy(true);
    setError("");
    try {
      await api(`/api/admin/events/${id}/desk/`, { method: "POST", json: { open } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update registration.");
    } finally {
      setDeskBusy(false);
    }
  }

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">{event.title}</h1>
          <p className="mt-1 text-sm text-mute">
            {event.venue} · {formatWhen(event.starts_at)}
          </p>
        </div>
        <span className={`status-pill ${event.is_closed ? "status-closed" : "status-open"}`}>
          {event.is_closed ? "Registration stopped" : "Registration open"}
        </span>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="action-row no-print mt-5">
        {event.is_closed ? (
          <button type="button" className="btn-blue px-4 py-2 text-sm" disabled={deskBusy} onClick={() => setDesk(true)}>
            {deskBusy ? "Saving…" : "Open registration"}
          </button>
        ) : (
          <button type="button" className="btn-stop px-4 py-2 text-sm" disabled={deskBusy} onClick={() => setDesk(false)}>
            {deskBusy ? "Saving…" : "Stop registration"}
          </button>
        )}
        <Link to={`/admin/events/${event.id}/edit`} className="btn-gold px-4 py-2 text-sm">
          Edit
        </Link>
        <button type="button" className="btn-paper px-4 py-2 text-sm" onClick={downloadCsv}>
          Download CSV
        </button>
        <button type="button" className="btn-paper px-4 py-2 text-sm" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="btn-paper-danger px-4 py-2 text-sm" onClick={removeEvent}>
          Delete
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-mute">Registered</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-kab">{rows.length}</p>
        </div>
      </div>

      <section className="audit-board">
        <h2 className="audit-heading">Who came</h2>
        <p className="audit-lead">Programme, year, and gender — use this to plan the next COSAKU event.</p>
        <div className="audit-grid">
          <PieChart title="Programme" slices={programmeSlices} />
          <PieChart title="Year of study" slices={yearSlices} />
          <PieChart title="Gender" slices={genderSlices} />
        </div>
      </section>

      <div className="mt-5 overflow-hidden bg-white">
        <div className="no-print border-b border-[#e6eaed] p-3">
          <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Kab Email</th>
                <th>WhatsApp number</th>
                <th>Programme</th>
                <th>Year</th>
                <th className="no-print">Door</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.full_name}</td>
                  <td>{row.gender || "—"}</td>
                  <td>{row.kab_email}</td>
                  <td>{row.phone}</td>
                  <td>{row.programme}</td>
                  <td>{row.year_of_study}</td>
                  <td className="no-print">
                    <button
                      type="button"
                      className={`px-3 py-1 text-xs font-semibold ${row.attended ? "bg-green text-white" : "bg-[#eef1f4] text-ink"}`}
                      onClick={() => toggle(row)}
                    >
                      {row.attended ? "Present" : "Mark"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-mute" colSpan={7}>
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
