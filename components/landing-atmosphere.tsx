const MOTES = [
  { left: "3%", size: 3, duration: 32, delay: -8, tone: "gold", drift: -18, rise: -48 },
  { left: "7%", size: 5, duration: 38, delay: -22, tone: "purple", drift: 22, rise: -52 },
  { left: "11%", size: 4, duration: 28, delay: 0, tone: "gold-pale", drift: 28, rise: -46 },
  { left: "15%", size: 3, duration: 24, delay: -14, tone: "gold-deep", drift: -12, rise: -54 },
  { left: "19%", size: 6, duration: 42, delay: -30, tone: "gold", drift: 16, rise: -50 },
  { left: "23%", size: 4, duration: 34, delay: -6, tone: "gold-pale", drift: -26, rise: -47 },
  { left: "27%", size: 5, duration: 36, delay: -18, tone: "gold-deep", drift: 34, rise: -53 },
  { left: "31%", size: 3, duration: 22, delay: -34, tone: "purple", drift: 8, rise: -45 },
  { left: "35%", size: 7, duration: 44, delay: -10, tone: "gold", drift: -22, rise: -51 },
  { left: "39%", size: 4, duration: 30, delay: -26, tone: "gold-pale", drift: 18, rise: -49 },
  { left: "43%", size: 5, duration: 36, delay: -2, tone: "gold-deep", drift: -30, rise: -55 },
  { left: "47%", size: 3, duration: 26, delay: -16, tone: "gold", drift: 14, rise: -46 },
  { left: "51%", size: 6, duration: 40, delay: -28, tone: "purple", drift: -16, rise: -52 },
  { left: "55%", size: 4, duration: 32, delay: -20, tone: "gold-pale", drift: 26, rise: -48 },
  { left: "59%", size: 3, duration: 22, delay: -38, tone: "gold-deep", drift: -8, rise: -50 },
  { left: "63%", size: 5, duration: 36, delay: -12, tone: "gold", drift: 20, rise: -54 },
  { left: "67%", size: 4, duration: 28, delay: -24, tone: "gold-deep", drift: -24, rise: -47 },
  { left: "71%", size: 8, duration: 48, delay: -8, tone: "purple", drift: 12, rise: -51 },
  { left: "75%", size: 3, duration: 24, delay: -32, tone: "gold-pale", drift: 32, rise: -45 },
  { left: "79%", size: 5, duration: 38, delay: -4, tone: "purple", drift: -20, rise: -53 },
  { left: "83%", size: 4, duration: 30, delay: -18, tone: "gold", drift: 18, rise: -49 },
  { left: "87%", size: 6, duration: 44, delay: -28, tone: "gold-deep", drift: -14, rise: -52 },
  { left: "91%", size: 3, duration: 26, delay: -10, tone: "gold-pale", drift: 24, rise: -46 },
  { left: "95%", size: 5, duration: 36, delay: -36, tone: "gold", drift: -10, rise: -50 },
  { left: "9%", size: 4, duration: 46, delay: -40, tone: "purple", drift: 6, rise: -48 },
  { left: "41%", size: 3, duration: 22, delay: -34, tone: "gold-deep", drift: -34, rise: -55 },
  { left: "73%", size: 4, duration: 34, delay: -38, tone: "purple", drift: 10, rise: -47 },
  { left: "97%", size: 4, duration: 32, delay: -14, tone: "gold-pale", drift: -6, rise: -51 },
] as const;

const MOTE_TONE_CLASS = {
  gold: "landing-mote-gold",
  "gold-pale": "landing-mote-gold-pale",
  "gold-deep": "landing-mote-gold-deep",
  purple: "landing-mote-purple",
} as const;

const MOTE_PEAK_OPACITY = 0.9 * 0.7;
const MOTE_FADE_IN_S = 0.4;
const MOTE_HOLD_S = 2;

const MOTE_FADE_CSS = MOTES.map((mote, index) => {
  const fadeInPct = ((MOTE_FADE_IN_S / mote.duration) * 100).toFixed(3);
  const fadeOutPct = (((MOTE_FADE_IN_S + MOTE_HOLD_S) / mote.duration) * 100).toFixed(3);
  return `@keyframes landing-mote-fade-${index}{0%{opacity:0}${fadeInPct}%{opacity:${MOTE_PEAK_OPACITY}}${fadeOutPct}%{opacity:${MOTE_PEAK_OPACITY}}100%{opacity:0}}`;
}).join("");

export function LandingPackAura() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-[-28%] z-0"
    >
      <div className="landing-pack-glow landing-pack-glow-core absolute inset-[18%]" />
      <div className="landing-pack-glow landing-pack-glow-halo absolute inset-0" />
    </div>
  );
}

export function LandingAtmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <style>{MOTE_FADE_CSS}</style>
      <div className="landing-well-indigo absolute top-[10%] left-[20%] h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="landing-well-gold absolute right-[10%] bottom-0 h-[1000px] w-[1000px] translate-x-1/4 translate-y-1/4 rounded-full" />
      <div className="ritual-stars absolute inset-0 opacity-40" />
      {MOTES.map((mote, index) => (
        <span
          key={index}
          className={
            `landing-mote ${MOTE_TONE_CLASS[mote.tone]}`
          }
          style={{
            left: mote.left,
            width: mote.size,
            height: mote.size,
            animation: `landingDrift ${mote.duration}s linear ${mote.delay}s infinite, landing-mote-fade-${index} ${mote.duration}s linear ${mote.delay}s infinite`,
            ["--mote-drift" as string]: `${mote.drift}px`,
            ["--mote-rise" as string]: `${mote.rise}vh`,
          }}
        />
      ))}
    </div>
  );
}
