import { Link } from "react-router-dom";

type LockupSize = "header" | "welcome";

export function LogoLockup({ size = "header" }: { size?: LockupSize }) {
  return (
    <div className={`logo-lockup ${size === "welcome" ? "logo-lockup--welcome" : "logo-lockup--header"}`}>
      <img src="/brand/kab-logo.jpg" alt="Kabale University crest" />
      <img src="/brand/cosaku-logo.png" alt="COSAKU" />
    </div>
  );
}

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoLockup size="header" />
      <div className="min-w-0 leading-tight">
        <p className={`font-[family-name:var(--font-display)] text-xl font-semibold tracking-[0.08em] sm:text-2xl ${light ? "text-white" : "text-navy"}`}>
          COSAKU
        </p>
        <p className={`text-[10px] uppercase tracking-[0.16em] sm:text-[11px] ${light ? "text-gold" : "text-blue"}`}>
          Kabale University
        </p>
      </div>
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center px-4 py-2.5 sm:px-8">
        <Link to="/" className="min-w-0">
          <BrandMark light />
        </Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-10 flex items-center justify-between border-t border-black/10 pt-5 text-xs text-mute">
      <p>COSAKU · Kabale University</p>
      <Link to="/admin/login" className="text-blue">
        Executives
      </Link>
    </footer>
  );
}
