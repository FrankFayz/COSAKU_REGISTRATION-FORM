import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoLockup } from "../components/Brand";

export function WelcomePage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  function go() {
    if (leaving) return;
    setLeaving(true);
    navigate("/register");
  }

  useEffect(() => {
    const timer = window.setTimeout(go, 5200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="welcome-shell grid place-items-center px-6 py-10">
      <div className={`mx-auto flex w-full max-w-md flex-col items-center text-center ${leaving ? "opacity-0 transition-opacity duration-300" : ""}`}>
        <div className="fade-up">
          <LogoLockup size="welcome" />
        </div>

        <h1 className="fade-up-delay mt-8 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-[0.18em] sm:text-6xl">
          COSAKU
        </h1>
        <p className="fade-up-delay mt-3 text-sm text-white/85">Computing Students Association</p>
        <div className="fade-up-late mt-6 gold-line" />

        <button onClick={go} className="btn-gold fade-up-late mt-10 px-10 py-3 text-sm tracking-[0.14em] uppercase">
          Continue
        </button>

        <div className="fade-up-late mt-10">
          <div className="progress-track">
            <div className="progress-fill" />
          </div>
        </div>
      </div>
    </main>
  );
}
