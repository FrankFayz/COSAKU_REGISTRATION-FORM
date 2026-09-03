import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, clearToken, getToken } from "../../api";
import { SiteHeader } from "../../components/Brand";
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
    <div className="admin-shell">
      <SiteHeader />
      <nav className="admin-subnav no-print">
        <NavLink to="/admin" end>
          Overview
        </NavLink>
        <NavLink to="/admin/events" end>
          Events
        </NavLink>
        <NavLink to="/admin/events/new">New event</NavLink>
        <span className="spacer" />
        <Link to="/register">Public form</Link>
        <button type="button" onClick={logout}>
          Sign out
        </button>
      </nav>
      <div className="admin-body">
        <Outlet />
      </div>
    </div>
  );
}
