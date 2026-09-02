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
    const payload = {
      title: form.get("title"),
      summary: form.get("summary"),
      description: form.get("description"),
      venue: form.get("venue"),
      starts_at: fromDateTimeLocal(String(form.get("starts_at") || "")),
      ends_at: fromDateTimeLocal(String(form.get("ends_at") || "")) || null,
      capacity: form.get("capacity") ? Number(form.get("capacity")) : null,
      extra_question: form.get("extra_question") || "",
      extra_question_required: form.get("extra_question_required") === "on",
      is_published: form.get("is_published") === "on",
      is_closed: form.get("is_closed") === "on",
      is_featured: form.get("is_featured") === "on",
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

  return (
    <div className="max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.28em] text-blue">{editing ? "Edit" : "Create"}</p>
      <h1 className="mt-2 mb-6 font-[family-name:var(--font-display)] text-4xl text-navy">
        {editing ? event?.title : "New COSAKU event"}
      </h1>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={onSubmit} className="card grid gap-4 p-6 sm:p-8">
        <label className="grid gap-2 text-sm font-medium text-navy">
          Event title
          <input className="field" name="title" required defaultValue={event?.title} placeholder="COSAKU workshop" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-navy">
          Short summary
          <input className="field" name="summary" required defaultValue={event?.summary} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-navy">
          Description
          <textarea className="field min-h-28" name="description" required defaultValue={event?.description} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-navy">
          Venue
          <input className="field" name="venue" required defaultValue={event?.venue} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-navy">
            Starts
            <input className="field" type="datetime-local" name="starts_at" required defaultValue={event ? toDateTimeLocal(event.starts_at) : ""} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-navy">
            Ends
            <input className="field" type="datetime-local" name="ends_at" defaultValue={event?.ends_at ? toDateTimeLocal(event.ends_at) : ""} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-navy">
          Capacity <span className="font-normal text-mute">(leave blank for unlimited)</span>
          <input className="field" type="number" min={1} name="capacity" defaultValue={event?.capacity ?? ""} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-navy">
          Extra question
          <input className="field" name="extra_question" defaultValue={event?.extra_question ?? ""} />
        </label>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="extra_question_required" defaultChecked={event?.extra_question_required} />
          Extra question is required
        </label>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="is_published" defaultChecked={event?.is_published ?? true} />
          Visible on the public form
        </label>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="is_closed" defaultChecked={event?.is_closed} />
          Close registration
        </label>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="is_featured" defaultChecked={event?.is_featured} />
          Feature this event first
        </label>
        <button className="btn-gold mt-2 py-3.5 text-sm uppercase tracking-[0.16em]" disabled={pending}>
          {pending ? "Saving…" : editing ? "Save changes" : "Publish event"}
        </button>
      </form>
    </div>
  );
}
