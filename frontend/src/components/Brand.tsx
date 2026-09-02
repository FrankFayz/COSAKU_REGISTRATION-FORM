import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="topbar">
        <span>Faculty of Computing, Library and Information Science</span>
        <span className="topbar-right">Kabale University</span>
      </div>
      <div className="masthead">
        <div className="logo-slot logo-slot--left">
          <img className="logo-cosaku" src="/brand/cosaku-logo.png" alt="COSAKU" />
        </div>
        <div className="logo-slot logo-slot--right">
          <img className="logo-kab" src="/brand/kab-logo.jpg" alt="Kabale University" />
        </div>
      </div>
      <div className="gold-bar" />
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="site-footer">
      <p>Computing Students Association of Kabale University</p>
      <Link to="/admin/login">Executives</Link>
    </footer>
  );
}
