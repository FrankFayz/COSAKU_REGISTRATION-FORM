import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/Brand";

export function WelcomePage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  function go() {
    if (leaving) return;
    setLeaving(true);
    navigate("/register");
  }

  useEffect(() => {
    const timer = window.setTimeout(go, 6500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-svh bg-cream">
      <SiteHeader />
      <section className="hero">
        <div className={`hero-inner fade-up ${leaving ? "opacity-0 transition-opacity duration-300" : ""}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kab">COSAKU</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold leading-snug text-kab sm:text-4xl">
            Computing Students Association of Kabale University
          </h1>
          <p className="mt-4 text-base italic text-mute">Moving technology to another level</p>
          <button onClick={go} className="btn-gold mt-8 px-10 py-3 text-sm tracking-[0.12em] uppercase">
            Continue
          </button>
        </div>
      </section>
    </div>
  );
}
