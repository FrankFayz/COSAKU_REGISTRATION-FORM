import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="masthead">
        <Link to="/" className="letterhead">
          <img className="logo-cosaku" src="/brand/cosaku-logo.png" alt="COSAKU" />
          <div className="letterhead-copy">
            <p className="letterhead-name">
              Computing Students Association
              <span> of Kabale University</span>
            </p>
            <p className="letterhead-motto">Moving technology to another level</p>
          </div>
        </Link>
      </div>
      <div className="header-stripe" aria-hidden="true" />
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="uni-footer">
      <div className="uni-badge">
        <img className="logo-kab-badge" src="/brand/kab-logo.jpg" alt="Kabale University" />
        <div>
          <p className="uni-name">Kabale University</p>
          <p className="uni-motto">Knowledge is the Future</p>
        </div>
      </div>
      <p className="uni-note">Moving technology to another level</p>
      <Link to="/admin/login" className="uni-exec">
        Executives
      </Link>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <SiteHeader />
      <div className="page-shell-body">{children}</div>
      <PublicFooter />
    </div>
  );
}
