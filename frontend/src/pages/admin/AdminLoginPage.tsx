import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../../api";
import { PageShell } from "../../components/Brand";

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
          email: String(form.get("email") || "").trim(),
          password: String(form.get("password") || ""),
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
    <PageShell>
      <main className="page-wrap">
        <form className="form-card" onSubmit={onSubmit}>
          <h1 className="form-title">Executive login</h1>
          <p className="form-lead">Events, attendance, and CSV lists.</p>
          {error ? <p className="form-alert mt-4">{error}</p> : null}
          <label className="form-label mt-6">
            Email
            <input className="field" name="email" type="email" autoComplete="username" required defaultValue="admin@cosaku.kab.ac.ug" />
          </label>
          <label className="form-label mt-4">
            Password
            <input className="field" name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="btn-blue mt-6 w-full py-3.5 text-sm uppercase tracking-[0.12em]" disabled={pending}>
            {pending ? "Checking…" : "Sign in"}
          </button>
        </form>
      </main>
    </PageShell>
  );
}
