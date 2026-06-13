import { useState, useEffect } from 'react';

/**
 * Reusable guided-exercise components.
 *
 * Previously the box-breathing timer and the 5-4-3-2-1 grounding script were
 * copy-pasted inline across Today, HelpSOS, and Layout. They now live here as
 * single-source components so the copy and behaviour stay consistent everywhere.
 */

export interface BreathingPhase {
  text: string;
  sub: string;
  /** Tailwind classes for the calm colour transition between phases. */
  bg: string;
}

/** The four phases of box breathing (4-4-4-4), in order. */
export const BREATHING_PHASES: BreathingPhase[] = [
  { text: 'Breathe In…', sub: 'Slowly through your nose (4s)', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { text: 'Hold…', sub: 'Gently keep the air in (4s)', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
  { text: 'Breathe Out…', sub: 'Slowly through your mouth (4s)', bg: 'bg-teal-50 border-teal-200 text-teal-700' },
  { text: 'Hold Empty…', sub: 'Rest before the next breath (4s)', bg: 'bg-rose-50 border-rose-200 text-rose-700' },
];

const PHASE_DURATION_MS = 4000;

interface BoxBreathingProps {
  /** Circle size: `lg` for full-screen support, `sm` inside compact modals. */
  size?: 'sm' | 'lg';
  /** Begin cycling as soon as the component mounts (default true). */
  autoStart?: boolean;
}

/**
 * An animated box-breathing guide that auto-advances every 4 seconds.
 * The phase is announced via an aria-live region and can be paused for
 * users who prefer to breathe at their own pace.
 */
export function BoxBreathing({ size = 'lg', autoStart = true }: BoxBreathingProps) {
  const [running, setRunning] = useState(autoStart);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % BREATHING_PHASES.length);
    }, PHASE_DURATION_MS);
    return () => clearInterval(interval);
  }, [running]);

  const phase = BREATHING_PHASES[step];
  const circleSize = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10';

  return (
    <div className="space-y-3">
      <div
        className={`border rounded-2xl p-5 text-center transition-all duration-500 ${phase.bg}`}
        role="status"
        aria-live="polite"
      >
        <div
          className={`${circleSize} border-2 border-current rounded-full flex items-center justify-center mx-auto mb-2 font-bold`}
          aria-hidden="true"
        >
          {step + 1}
        </div>
        <h4 className="font-bold text-lg">{phase.text}</h4>
        <p className="text-xs opacity-90 mt-0.5">{phase.sub}</p>
      </div>
      <button
        type="button"
        onClick={() => setRunning((prev) => !prev)}
        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 rounded-xl transition-all"
      >
        {running ? 'Pause' : 'Resume breathing'}
      </button>
    </div>
  );
}

/** The 5-4-3-2-1 senses grounding script (static, works offline). */
export function Grounding54321() {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 animate-fade-in">
      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700">5-4-3-2-1 Grounding Method</h4>
      <p className="text-xs text-slate-500">
        Gently shift attention to your surroundings — it helps divert focus away from stressful exam thoughts. Slowly name:
      </p>
      <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-4">
        <li>
          <strong>5 things you can SEE</strong> (e.g. your textbook, a pen, the window).
        </li>
        <li>
          <strong>4 things you can TOUCH</strong> (e.g. your sleeve, the desk under your hands).
        </li>
        <li>
          <strong>3 things you can HEAR</strong> (e.g. a fan, the clock, traffic outside).
        </li>
        <li>
          <strong>2 things you can SMELL</strong> (e.g. a cup of tea, fresh air).
        </li>
        <li>
          <strong>1 thing you can TASTE</strong> (e.g. mint, water).
        </li>
      </ol>
    </div>
  );
}
