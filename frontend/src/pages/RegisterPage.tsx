import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, asList } from "../api";
import { PageShell } from "../components/Brand";
import type { EventItem, RegistrationItem } from "../types";
import { PROGRAMMES, YEARS, GENDERS, formatClock, formatDayNum, formatMonthShort, formatWeekday, formatYear } from "../utils";

function shortError(message: string) {
  if (/already registered/i.test(message)) return "This Kab email is already registered.";
  if (/full/i.test(message)) return "This event is full.";
  if (/closed/i.test(message)) return "Registration is closed.";
  if (/kabale university email|kab email|valid email/i.test(message)) return "Use your @kab.ac.ug email.";
  if (/phone|whatsapp|07xx|country code/i.test(message)) return "Enter a WhatsApp number, with or without the country code.";
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
          gender: form.get("gender"),
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

  return (
    <PageShell>
      <main className="page-wrap">
        <p className="form-kicker">COSAKU registration</p>
        <h1 className="form-title">Join the event of the day</h1>

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

        {selected ? (
          <article className="event-desk">
            <p className="event-desk-kicker">Event of the day</p>
            <div className="event-desk-head">
              <div className="event-desk-cal" aria-hidden="true">
                <span className="event-desk-cal-month">{formatMonthShort(selected.starts_at)}</span>
                <span className="event-desk-cal-day">{formatDayNum(selected.starts_at)}</span>
                <span className="event-desk-cal-year">{formatYear(selected.starts_at)}</span>
              </div>
              <div className="event-desk-copy">
                <h2 className="event-desk-title">{selected.title}</h2>
                <p className="event-desk-when">
                  {formatWeekday(selected.starts_at)} · {formatClock(selected.starts_at)}
                  {selected.ends_at ? ` – ${formatClock(selected.ends_at)}` : ""}
                </p>
              </div>
            </div>
          </article>
        ) : !loading ? (
          <article className="event-desk event-desk-empty">
            <p className="event-desk-kicker">Event of the day</p>
            <h2 className="event-desk-title">No event is open</h2>
            <p className="event-desk-note">Registration will appear here when executives open a desk.</p>
          </article>
        ) : null}

        <form onSubmit={onSubmit} className="form-card mt-5">
          {error ? <p className="form-alert">{error}</p> : null}
          {!loading && !selected ? <p className="mb-4 text-sm text-mute">The form is closed until an event is opened.</p> : null}

          <div className="form-grid">
            <label className="form-label form-span-2">
              Full name
              <input className="field" name="full_name" autoComplete="name" required placeholder="As on your student card" />
            </label>
            <fieldset className="form-label form-span-2 gender-set">
              <legend>Gender</legend>
              <div className="gender-row">
                {GENDERS.map((gender) => (
                  <label key={gender} className="gender-chip">
                    <input type="radio" name="gender" value={gender} required />
                    {gender}
                  </label>
                ))}
              </div>
            </fieldset>
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
              <input className="field" name="phone" inputMode="tel" autoComplete="tel" required placeholder="0700 123 456 or +256…" />
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
            className="btn-blue mt-6 w-full py-3.5 text-sm uppercase tracking-[0.14em] disabled:opacity-50"
            disabled={pending || loading || !selected || selected.is_full}
          >
            {loading ? "Loading…" : !selected ? "Closed" : selected.is_full ? "Full" : pending ? "Submitting…" : "Submit registration"}
          </button>
        </form>
      </main>
    </PageShell>
  );
}
