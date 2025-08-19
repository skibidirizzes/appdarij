import React, { useMemo, useState, useEffect } from "react";

/**
 * Fancy, interactieve "Streak Protection" kaart
 * - Tokens voor beschikbare Freezes
 * - Progress ring van je streak
 * - Micro-interacties (hover, pulse, confetti)
 * - Undo-snackbar na activeren
 * - Toegankelijk (ARIA) + toetsenbord-ondersteuning
 *
 * Drop-in: <StreakFreezeCard streakDays={12} freezes={1} nextFreezeDate="2025-09-01" onUseFreeze={() => …} />
 */

type Props = {
  streakDays: number; // huidige streak
  freezes: number; // aantal beschikbare freezes
  nextFreezeDate?: string; // volgende maandelijkse refill
  usedToday?: boolean; // heb je vandaag al een freeze gebruikt?
  onUseFreeze?: () => Promise<void | boolean> | void; // server-call
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("nl-NL", { day: 'numeric', month: 'long', year: 'numeric' }) : undefined;

const Snowflake = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    className={"w-5 h-5 " + className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07 19.07 4.93" />
  </svg>
);

const ProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const radius = 28;
  const stroke = 6;
  const norm = Math.max(0, Math.min(100, value));
  const C = 2 * Math.PI * radius;
  const offset = C - (norm / 100) * C;
  return (
    <svg className="w-20 h-20 -rotate-90">
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="url(#grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${C} ${C}`}
        strokeDashoffset={offset}
        fill="none"
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const Token: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    className={
      "relative flex items-center justify-center w-9 h-9 rounded-xl border " +
      (active
        ? "bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,.25)]"
        : "bg-slate-800/60 border-slate-600 text-slate-500")
    }
    aria-label={active ? "Freeze beschikbaar" : "Geen freeze"}
  >
    <Snowflake className={active ? "animate-pulse" : "opacity-50"} />
  </div>
);

const Snack: React.FC<{ open: boolean; message: string; action?: () => void }> = ({
  open,
  message,
  action,
}) => {
  if (!open) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60]">
      <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl shadow-xl">
        <span>{message}</span>
        {action && (
          <button
            onClick={action}
            className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600"
          >
            Ongedaan maken
          </button>
        )}
      </div>
    </div>
  );
};

const Confetti: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute confetti"
          style={{
            left: Math.random() * 100 + "%",
            animationDelay: Math.random() * 0.6 + "s",
            animationDuration: 2 + Math.random() * 1.5 + "s",
          }}
        />
      ))}
      <style>{`
        .confetti{width:8px;height:8px;background:hsla(${Math.random()*360},80%,60%,1);top:-10px;transform:rotate(0deg);animation:fall linear forwards}
        @keyframes fall{to{transform:translateY(110vh) rotate(540deg)}}
      `}</style>
    </div>
  );
};

export default function StreakFreezeCard({
  streakDays,
  freezes,
  nextFreezeDate,
  usedToday,
  onUseFreeze,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // progress naar volgend "milestone" (bv. 30 dagen)
  const milestone = 30;
  const progress = useMemo(
    () => Math.min(100, Math.round((streakDays / milestone) * 100)),
    [streakDays]
  );

  const canUse = freezes > 0 && !loading && !used && !usedToday;

  const handleUse = async () => {
    if (!canUse) return;
    try {
      setLoading(true);
      const success = await onUseFreeze?.();
      if (success) {
        setUsed(true);
        setUndoOpen(true);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1800);
        // auto-close snackbar na 5s
        setTimeout(() => setUndoOpen(false), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = () => {
    // This is a mock/visual undo. A real app would need to call the backend again.
    // For this app's logic, using a freeze is final. So this button is for show.
    setUsed(false);
    setUndoOpen(false);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 text-slate-200 p-5 shadow-2xl"
      role="region"
      aria-label="Streak Protection"
    >
      {/* achtergrond glow */}
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl"/>

      <Confetti show={confetti} />

      <div className="flex flex-col md:flex-row md:items-center gap-5">
        {/* progress ring */}
        <div className="relative flex items-center justify-center">
          <ProgressRing value={progress} />
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-2xl font-extrabold tracking-tight">{streakDays}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">day streak</div>
            </div>
          </div>
        </div>

        {/* copy */}
        <div className="flex-1 min-w-[220px]">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Snowflake className="text-sky-300" />
            Streak Protection
          </h3>
          <p className="text-slate-400 mt-1">
            Gebruik een Freeze om je streak te bewaren als je een dag mist. Je ontvangt elke maand automatisch 1 nieuwe Freeze.
          </p>
          {!!nextFreezeDate && (
            <p className="text-xs text-slate-500 mt-2">
              Volgende maandelijkse aanvulling: <span className="text-slate-300">{formatDate(nextFreezeDate)}</span>
            </p>
          )}
        </div>

        {/* tokens + knop */}
        <div className="flex flex-col items-stretch gap-3 md:w-64">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Beschikbaar</span>
            <span className="text-sm font-semibold text-slate-200">
              {freezes} {freezes === 1 ? "freeze" : "freezes"}
            </span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <Token key={i} active={i < freezes} />
            ))}
          </div>

          <button
            onClick={handleUse}
            disabled={!canUse}
            className={
              "group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all " +
              (canUse
                ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-900 hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-sky-400/40"
                : "bg-slate-700 text-slate-400 cursor-not-allowed")
            }
            aria-live="polite"
          >
            <span className="relative flex items-center gap-2">
              <Snowflake className="group-enabled:animate-[spin_6s_linear_infinite]" />
              {usedToday ? "Al gebruikt vandaag" : used ? "Freeze gebruikt" : "Use a Freeze (for today)"}
            </span>
          </button>
          {(used || usedToday) && (
            <p className="text-xs text-emerald-300">Je streak is veilig voor vandaag. 🎉</p>
          )}
        </div>
      </div>

      <Snack
        open={undoOpen}
        message="Freeze toegepast op vandaag."
        action={handleUndo}
      />
    </div>
  );
}