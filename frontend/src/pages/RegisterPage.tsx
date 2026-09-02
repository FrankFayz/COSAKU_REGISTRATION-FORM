import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, asList } from "../api";
import { PublicFooter, SiteHeader } from "../components/Brand";
import type { EventItem, RegistrationItem } from "../types";
import { PROGRAMMES, YEARS, formatClock, formatDay } from "../utils";

function shortError(message: string) {
  if (/already registered/i.test(message)) return "This Kab email is already registered.";
  if (/full/i.test(message)) return "This event is full.";
  if (/closed/i.test(message)) return "Registration is closed.";
  if (/kabale university email|kab email|valid email/i.test(message)) return "Use your @kab.ac.ug email.";
  if (/phone|whatsapp|07xx/i.test(message)) return "Enter a valid WhatsApp number.";
  if (/could not reach|not configured/i.test(message)) return "Could not reach the registration desk.";
  const first = message.split(/[.!]/)[0]?.trim();
  return first ? `${first}.` : "Could not register.";
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<EventItem[] | { results?: EventItem[] }>("/api/events/")
      .then((data) => {
        const next = asList<EventItem>(data);
        setEvents(next);
        setEventId(next[0]?.id ?? null);
      })
      .catch((err: Error) => {
        setEvents([]);
        setError(shortError(err.message));
      })
      .finally(() => setLoading(false));
  }, []);

  const list = Array.isArray(events) ? events : [];
  const selected = useMemo(
    () => list.find((event) => event.id === eventId) ?? list[0],
    [list, eventId],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const created = await api<RegistrationItem>(`/api/events/${selected.id}/register/`, {
        method: "POST",
        json: {
          full_name: form.get("full_name"),
          kab_email: form.get("kab_email"),
          phone: form.get("phone"),
          programme: form.get("programme"),
          year_of_study: form.get("year_of_study"),
          extra_answer: form.get("extra_answer") || "",
        },
      });
      sessionStorage.setItem("cosaku_last_registration", JSON.stringify(created));
      navigate(`/register/success?id=${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? shortError(err.message) : "Could not register.");
      setPending(false);
    }
  }

  const showDetails = Boolean(selected?.show_public_details);

  return (
    <div className="min-h-svh bg-cream">
      <SiteHeader />
      <main className="page-wrap">
        <p className="form-kicker">COSAKU</p>
        <h1 className="form-title">Event registration</h1>
        <p className="form-lead">Computing Students Association of Kabale University</p>

        {list.length > 1 ? (
          <div className="event-switch mt-5">
            {list.map((event) => (
              <button
                key={event.id}
                type="button"
                aria-pressed={event.id === selected?.id}
                onClick={() => setEventId(event.id)}
                className="chip"
              >
                {event.title}
              </button>
            ))}
          </div>
        ) : null}

        {selected && showDetails ? (
          <p className="event-line">
            {selected.title}
            <span>
              {formatDay(selected.starts_at)} · {formatClock(selected.starts_at)}
              {selected.ends_at ? ` – ${formatClock(selected.ends_at)}` : ""} · {selected.venue}
            </span>
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="form-card mt-5">
          {loading ? <p className="mb-4 text-sm text-mute">Loading the desk…</p> : null}
          {error ? <p className="form-alert">{error}</p> : null}
          {!loading && !selected ? <p className="mb-4 text-sm text-mute">No open event yet.</p> : null}

          <div className="form-grid">
            <label className="form-label form-span-2">
              Full name
              <input className="field" name="full_name" autoComplete="name" required placeholder="As on your student card" />
            </label>
            <label className="form-label">
              Kab Email
              <input
                className="field"
                name="kab_email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@kab.ac.ug"
              />
            </label>
            <label className="form-label">
              WhatsApp number
              <input className="field" name="phone" inputMode="tel" autoComplete="tel" required placeholder="07XX XXX XXX" />
            </label>
            <label className="form-label">
              Programme
              <select className="field" name="programme" required defaultValue="">
                <option value="" disabled>
                  Select programme
                </option>
                {PROGRAMMES.map((programme) => (
                  <option key={programme} value={programme}>
                    {programme}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Year
              <select className="field" name="year_of_study" required defaultValue="">
                <option value="" disabled>
                  Select year
                </option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            {selected?.extra_question ? (
              <label className="form-label form-span-2">
                {selected.extra_question}
                <input className="field" name="extra_answer" required={selected.extra_question_required} />
              </label>
            ) : null}
          </div>

          <button
            className="btn-gold mt-6 w-full py-3.5 text-sm uppercase tracking-[0.14em] disabled:opacity-50"
            disabled={pending || !selected || selected.is_full}
          >
            {!selected ? "Closed" : selected.is_full ? "Full" : pending ? "Submitting…" : "Submit registration"}
          </button>
        </form>

        <PublicFooter />
      </main>
    </div>
  );
}
