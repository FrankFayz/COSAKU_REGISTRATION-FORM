import { Link, Outlet, useNavigate } from "react-router-dom";
import { api, clearToken, getToken } from "../../api";
import { BrandMark } from "../../components/Brand";
import { useEffect } from "react";

export function AdminShell() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate("/admin/login");
  }, [navigate]);

  async function logout() {
    try {
      await api("/api/auth/logout/", { method: "POST" });
    } catch {
      /* token may already be gone */
    }
    clearToken();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-svh bg-cream">
      <div className="mx-auto grid min-h-svh max-w-6xl lg:grid-cols-[240px_1fr]">
        <aside className="no-print border-b border-navy/10 bg-navy px-5 py-6 text-white lg:border-b-0 lg:border-r lg:border-white/10">
          <BrandMark light />
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold">Executive desk</p>
          <nav className="mt-8 grid gap-1 text-sm">
            <Link className="px-3 py-2 hover:bg-white/10" to="/admin">
              Overview
            </Link>
            <Link className="px-3 py-2 hover:bg-white/10" to="/admin/events">
              Events
            </Link>
            <Link className="px-3 py-2 hover:bg-white/10" to="/admin/events/new">
              New event
            </Link>
            <Link className="px-3 py-2 hover:bg-white/10" to="/register">
              Public form
            </Link>
          </nav>
          <button className="mt-10 text-xs uppercase tracking-[0.18em] text-white/60" onClick={logout} type="button">
            Sign out
          </button>
        </aside>
        <div className="px-5 py-6 sm:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
