import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, asList } from "../api";
import { PublicFooter, SiteHeader } from "../components/Brand";
import type { EventItem, RegistrationItem } from "../types";
import { PROGRAMMES, YEARS, formatClock, formatDay } from "../utils";

function shortError(message: string) {
  if (/already registered/i.test(message)) return "Already registered.";
  if (/full/i.test(message)) return "Event is full.";
  if (/closed/i.test(message)) return "Registration closed.";
  if (/kabale university email/i.test(message)) return "Use your Kabale University email.";
  if (/kab email|valid email/i.test(message)) return "Enter your Kab email.";
  if (/phone|whatsapp|07xx/i.test(message)) return "Use a valid WhatsApp number.";
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
        const list = asList<EventItem>(data);
        setEvents(list);
        setEventId(list[0]?.id ?? null);
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
  const seats = selected
    ? selected.capacity
      ? selected.is_full
        ? "Full"
        : `${selected.seats_left} / ${selected.capacity}`
      : `${selected.taken} registered`
    : "";

  return (
    <div className="min-h-svh bg-cream">
      <SiteHeader />
      <main className="page-wrap">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-kab">Register</h1>
        {loading ? <p className="mt-4 text-sm text-mute">Loading…</p> : null}

        <div className="mt-6 grid gap-5">
          {list.length > 1 ? (
            <div className="grid gap-2">
              {list.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  aria-pressed={event.id === selected?.id}
                  onClick={() => setEventId(event.id)}
                  className="chip px-3 py-2.5 text-left"
                >
                  <p className="font-medium text-navy">{event.title}</p>
                </button>
              ))}
            </div>
          ) : null}

          {selected && showDetails ? (
            <aside className="card p-5">
              <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-navy">{selected.title}</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-mute">When</dt>
                  <dd className="mt-0.5 font-medium text-navy">
                    {formatDay(selected.starts_at)} · {formatClock(selected.starts_at)}
                    {selected.ends_at ? ` – ${formatClock(selected.ends_at)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-mute">Where</dt>
                  <dd className="mt-0.5 font-medium text-navy">{selected.venue}</dd>
                </div>
                <div>
                  <dt className="text-mute">Seats</dt>
                  <dd className="mt-0.5 font-medium text-navy">{seats}</dd>
                </div>
              </dl>
            </aside>
          ) : null}

          <form onSubmit={onSubmit} className="form-card">
            {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
            {!loading && !selected ? <p className="mb-4 text-sm text-mute">No open event yet.</p> : null}
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Name
                <input className="field" name="full_name" autoComplete="name" required />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Kab Email
                <input className="field" name="kab_email" type="email" autoComplete="email" required />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                WhatsApp number
                <input className="field" name="phone" inputMode="tel" autoComplete="tel" required />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Programme
                <select className="field" name="programme" required defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {PROGRAMMES.map((programme) => (
                    <option key={programme} value={programme}>
                      {programme}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Year
                <select className="field" name="year_of_study" required defaultValue="">
                  <option value="" disabled>
                    Select
                  </option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
              {selected?.extra_question ? (
                <label className="grid gap-1.5 text-sm font-medium text-ink">
                  {selected.extra_question}
                  <input className="field" name="extra_answer" required={selected.extra_question_required} />
                </label>
              ) : null}
            </div>
            <button
              className="btn-gold mt-6 w-full py-3.5 text-sm uppercase tracking-[0.12em] disabled:opacity-50"
              disabled={pending || !selected || selected.is_full}
            >
              {!selected ? "Unavailable" : selected.is_full ? "Full" : pending ? "Saving…" : "Register"}
            </button>
          </form>
        </div>

        <PublicFooter />
      </main>
    </div>
  );
}
