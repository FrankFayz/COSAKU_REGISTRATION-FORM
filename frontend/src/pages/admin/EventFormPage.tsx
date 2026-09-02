import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import type { EventItem } from "../../types";
import { fromDateTimeLocal, toDateTimeLocal } from "../../utils";

export function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    if (!id) return;
    api<EventItem>(`/api/admin/events/${id}/`)
      .then(setEvent)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const open = form.get("is_open") === "on";
    const payload = {
      title: form.get("title"),
      venue: form.get("venue"),
      starts_at: fromDateTimeLocal(String(form.get("starts_at") || "")),
      ends_at: fromDateTimeLocal(String(form.get("ends_at") || "")) || null,
      is_published: true,
      is_closed: !open,
      summary: String(form.get("title") || ""),
      description: "",
      capacity: null,
      extra_question: "",
      extra_question_required: false,
      is_featured: false,
    };
    try {
      const saved = editing
        ? await api<EventItem>(`/api/admin/events/${id}/`, { method: "PUT", json: payload })
        : await api<EventItem>("/api/admin/events/", { method: "POST", json: payload });
      navigate(`/admin/events/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save event.");
      setPending(false);
    }
  }

  if (editing && !event && !error) {
    return <p className="text-mute">Loading event…</p>;
  }

  const openByDefault = event ? !event.is_closed : true;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">
        {editing ? "Edit event" : "New event"}
      </h1>
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="form-card mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Title
          <input className="field" name="title" required defaultValue={event?.title} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Venue
          <input className="field" name="venue" required defaultValue={event?.venue} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Starts
            <input
              className="field"
              type="datetime-local"
              name="starts_at"
              required
              defaultValue={event ? toDateTimeLocal(event.starts_at) : ""}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Ends
            <input
              className="field"
              type="datetime-local"
              name="ends_at"
              defaultValue={event?.ends_at ? toDateTimeLocal(event.ends_at) : ""}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="is_open" defaultChecked={openByDefault} />
          Open for registration
        </label>
        <button className="btn-gold mt-1 py-3.5 text-sm uppercase tracking-[0.12em]" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save" : "Create event"}
        </button>
      </form>
    </div>
  );
}
