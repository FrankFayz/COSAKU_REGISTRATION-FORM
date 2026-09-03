import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function WelcomePage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  function go() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => navigate("/register"), 380);
  }

  return (
    <main className={`splash ${leaving ? "is-leaving" : ""}`}>
      <div className="splash-stage">
        <div className="splash-logo-plate">
          <img className="splash-logo" src="/brand/cosaku-logo.png" alt="COSAKU" />
        </div>
        <p className="splash-hello">Welcome</p>
        <p className="splash-motto">Moving technology to another level</p>
      </div>
      <div className="splash-foot">
        <button className="splash-cta" type="button" onClick={go}>
          Continue
        </button>
      </div>
    </main>
  );
}
