import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../../api";
import { BrandMark } from "../../components/Brand";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ token: string }>("/api/auth/login/", {
        method: "POST",
        json: {
          email: form.get("email"),
          password: form.get("password"),
        },
      });
      setToken(data.token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setPending(false);
    }
  }

  return (
    <main className="welcome-shell grid place-items-center px-5 py-10">
      <form className="w-full max-w-md bg-paper p-8 text-ink" onSubmit={onSubmit}>
        <BrandMark />
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-navy">Executive login</h1>
        <p className="mt-2 text-sm text-mute">Events, attendance, and CSV lists.</p>
        {error ? <p className="mt-4 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <label className="mt-6 grid gap-2 text-sm font-medium text-navy">
          Email
          <input className="field" name="email" type="email" required defaultValue="admin@cosaku.kab.ac.ug" />
        </label>
        <label className="mt-4 grid gap-2 text-sm font-medium text-navy">
          Password
          <input className="field" name="password" type="password" required />
        </label>
        <button className="btn-gold mt-6 w-full py-3.5 text-sm uppercase tracking-[0.16em]" disabled={pending}>
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
