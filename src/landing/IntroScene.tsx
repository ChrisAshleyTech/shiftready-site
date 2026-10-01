// Opening animation for the landing page: a person works on a laptop at home, packs up, walks to the
// office as the sun comes up and goes in through the Rolevara door R (Christopher's logo artwork,
// public/brand/rolevara-door.png, never redrawn). Other people head to work in the background and the
// office lights come on once they're in.
// Pure SVG + CSS keyframes (styles in index.css under "Landing intro"), so it pre-renders and costs no
// script. Each element's resting style is the still frame (the person at the door, in daylight); the
// animations play from the start state into it. Reduced motion shows only the still frame, and the
// shared Pause button freezes it.
import type { CSSProperties } from "react";

type Look = { skin: string; hair: string; top: string; topDark: string; pants: string; pantsDark: string; shoe: string; bag?: string };

const HERO: Look = { skin: "#8D5A3B", hair: "#1B1B1F", top: "#00ADA8", topDark: "#008985", pants: "#24365C", pantsDark: "#1A2843", shoe: "#0B0F1A", bag: "#EF7D5E" };
const COMMUTER_A: Look = { skin: "#E0B08E", hair: "#7A4B26", top: "#5BB4E8", topDark: "#3E95C9", pants: "#3B4A66", pantsDark: "#2C3850", shoe: "#1A1F2B", bag: "#F2A93B" };
const COMMUTER_B: Look = { skin: "#C68A5E", hair: "#2B1D14", top: "#EF7D5E", topDark: "#C9603F", pants: "#2E3C5A", pantsDark: "#222D45", shoe: "#141821" };

/** A person in side view, facing right, feet at (0, 0), about 120 units tall. Limbs swing while `.walking`. */
function Person({ look, className, style }: { look: Look; className?: string; style?: CSSProperties }) {
  return (
    <g className={className} style={style}>
      <g className="p-body">
        <g className="p-leg p-leg-b"><rect x={-5.5} y={-50} width={11} height={47} rx={5.5} fill={look.pantsDark} /><path d="M-6 -6h13a6 6 0 0 1 6 6h-19z" fill={look.shoe} /></g>
        <g className="p-arm p-arm-b"><rect x={-4} y={-90} width={8} height={36} rx={4} fill={look.topDark} /><circle cy={-54} r={4} fill={look.skin} /></g>
        {look.bag && <><path d="M-6 -91 L9 -60" stroke="#0B2B5F" strokeWidth={2.5} strokeLinecap="round" /><rect x={-22} y={-68} width={13} height={19} rx={3} fill={look.bag} /></>}
        <g className="p-leg p-leg-f"><rect x={-5.5} y={-50} width={11} height={47} rx={5.5} fill={look.pants} /><path d="M-6 -6h13a6 6 0 0 1 6 6h-19z" fill={look.shoe} /></g>
        <rect x={-12.5} y={-96} width={25} height={50} rx={9} fill={look.top} />
        <path d="M-4 -95 L2 -76 L8 -94" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.4} fill="none" />
        <rect x={-2} y={-77} width={8} height={10} rx={1.5} fill="#F2A93B" />
        <rect x={-3} y={-103} width={7} height={9} fill={look.skin} />
        <circle cx={1.5} cy={-111} r={11} fill={look.skin} />
        <path d="M-10 -108c-3-12 9-18 17-15 4 1 7 4 7 8-6-2-11-1-14 2l-3 9z" fill={look.hair} />
        <circle cx={8} cy={-111} r={1.3} fill="#0B0F1A" />
        <path d="M6.5 -105.5q2.5 1.6 5 0" stroke="#0B0F1A" strokeWidth={1.1} fill="none" strokeLinecap="round" />
        <g className="p-arm p-arm-f"><rect x={-4} y={-90} width={8} height={36} rx={4} fill={look.top} /><circle cy={-54} r={4} fill={look.skin} /></g>
      </g>
    </g>
  );
}

/** Small "work" cards: a ticket, a key and a passed check. Drawn at (0, 0), about 40 x 28. */
function WorkCard({ kind, at, className, style }: { kind: "ticket" | "key" | "check"; at: [number, number, number?]; className?: string; style?: CSSProperties }) {
  const stripe = kind === "ticket" ? "#1764B8" : kind === "key" ? "#F2A93B" : "#00ADA8";
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${at[2] ?? 1})`}><g className={className} style={style}>
      <rect width={42} height={28} rx={6} fill="#fff" />
      <path d="M0 6a6 6 0 0 1 6-6h30a6 6 0 0 1 6 6v1H0z" fill={stripe} />
      {kind === "ticket" && <><rect x={6} y={12} width={22} height={3} rx={1.5} fill="#9FB3CF" /><rect x={6} y={18} width={14} height={3} rx={1.5} fill="#C9D5E6" /><circle cx={34} cy={18} r={3.5} fill="#EF7D5E" /></>}
      {kind === "key" && <><circle cx={13} cy={17} r={4.5} fill="none" stroke="#F2A93B" strokeWidth={2.5} /><path d="M17 17h17m-4 0v4m-5-4v3" stroke="#F2A93B" strokeWidth={2.5} strokeLinecap="round" /></>}
      {kind === "check" && <><path d="M21 10l9 3v5c0 4-4 6.5-9 8-5-1.5-9-4-9-8v-5z" fill="#00ADA8" /><path d="M17 17.5l3 3 5-5.5" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
    </g></g>
  );
}

// Start time for a staggered animation, read by index.css as --t.
const d = (s: number) => ({ "--t": `${s}s` }) as CSSProperties;

// Office windows: [column, row], 8 x 3 grid. Most light up after the person goes in; a few have people.
const WINDOWS = Array.from({ length: 24 }, (_, i) => [i % 8, Math.floor(i / 8)] as const);
const DARK = new Set([3, 9, 14, 20]);
const STAFFED = new Set([1, 6, 10, 13, 17, 22]);
const STARS = [[40, 30], [120, 64], [210, 22], [300, 50], [380, 18], [460, 70], [540, 34], [610, 14], [700, 22], [860, 16], [930, 40], [250, 96], [420, 110]];
const SKYLINE: [number, number, number][] = [[318, 64, 120], [388, 40, 160], [434, 58, 104], [498, 46, 180], [550, 70, 128], [604, 34, 150]];

export function IntroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 960 440" className={className} role="img" aria-labelledby="intro-scene-t" data-intro-scene>
      <title id="intro-scene-t">A person working at a laptop at home packs up, walks confidently to the office as the sun comes up, and goes in through the Rolevara door. Other people head to work and the office lights come on.</title>
      <defs>
        <linearGradient id="is-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#061A3A" /><stop offset=".62" stopColor="#2A4A80" /><stop offset="1" stopColor="#EF7D5E" /></linearGradient>
        <linearGradient id="is-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1764B8" /><stop offset=".7" stopColor="#5BB4E8" /><stop offset="1" stopColor="#CFE8F7" /></linearGradient>
        <radialGradient id="is-sun"><stop offset=".55" stopColor="#FFD58A" /><stop offset=".7" stopColor="#F2A93B" stopOpacity=".55" /><stop offset="1" stopColor="#F2A93B" stopOpacity="0" /></radialGradient>
        <linearGradient id="is-doorlight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF6E0" /><stop offset="1" stopColor="#FFD58A" /></linearGradient>
        <linearGradient id="is-screen" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#CFF5F3" stopOpacity=".55" /><stop offset="1" stopColor="#CFF5F3" stopOpacity="0" /></linearGradient>
        <radialGradient id="is-lamp" cx=".5" cy="0" r="1"><stop offset="0" stopColor="#FFD58A" stopOpacity=".7" /><stop offset="1" stopColor="#FFD58A" stopOpacity="0" /></radialGradient>
        <filter id="is-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* Sky: dawn fading into day, stars going out, sun rising. */}
      <rect width={960} height={440} fill="url(#is-dawn)" />
      <rect className="is-day" width={960} height={440} fill="url(#is-day)" />
      <g className="is-stars" fill="#fff">{STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.2 : 1.8} />)}</g>
      <g className="is-sun"><circle cx={410} cy={140} r={70} fill="url(#is-sun)" /></g>
      <g className="is-clouds" fill="#fff">
        <g opacity={0.5}><ellipse cx={180} cy={70} rx={46} ry={13} /><ellipse cx={204} cy={60} rx={26} ry={14} /></g>
        <g opacity={0.35}><ellipse cx={600} cy={96} rx={52} ry={12} /><ellipse cx={576} cy={88} rx={24} ry={12} /></g>
      </g>

      {/* City between home and office. */}
      <g fill="#123A70">{SKYLINE.map(([x, w, h]) => <rect key={x} x={x} y={400 - h} width={w} height={h} />)}</g>
      <g fill="#FFD58A" opacity={0.45}>{SKYLINE.flatMap(([x, w, h]) => Array.from({ length: Math.floor((h - 20) / 22) }, (_, r) =>
        Array.from({ length: Math.floor((w - 8) / 14) }, (_, c) => (r + c + x) % 3 ? null : <rect key={`${x}-${r}-${c}`} x={x + 8 + c * 14} y={400 - h + 12 + r * 22} width={6} height={8} />)))}</g>

      {/* Ground and street. */}
      <rect y={400} width={960} height={40} fill="#0A2752" />
      <rect y={400} width={960} height={6} fill="#2A4A80" />
      <g stroke="#3D5F96" strokeWidth={2} strokeDasharray="16 14"><path d="M0 424H960" /></g>

      {/* Trees and a street light that switches off as the day comes. */}
      {[[352, 1], [618, 0.85]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 400) scale(${s})`}><rect x={-4} y={-46} width={8} height={46} fill="#3B2A1F" /><circle cy={-62} r={24} fill="#0B6F6C" /><circle cx={-14} cy={-50} r={16} fill="#0E807C" /><circle cx={13} cy={-48} r={15} fill="#095E5B" /></g>
      ))}
      <g><rect x={478} y={312} width={4} height={88} fill="#3D5F96" /><path d="M480 314h16" stroke="#3D5F96" strokeWidth={4} strokeLinecap="round" /><circle cx={496} cy={318} r={4} fill="#FFE7B0" />
        <circle className="is-streetlight" cx={496} cy={322} r={22} fill="#FFD58A" opacity={0} filter="url(#is-blur)" /></g>

      {/* Commuters, behind the house and the office, so they walk out from one and into the other. */}
      <Person look={COMMUTER_A} className="is-commuter is-commuter-a walking" />
      <Person look={COMMUTER_B} className="is-commuter is-commuter-b walking" />

      {/* Home office, cut away. */}
      <g>
        <polygon points="12,202 162,120 312,202" fill="#0B2B5F" />
        <rect x={24} y={200} width={276} height={200} fill="#15386C" />
        <rect x={24} y={392} width={276} height={8} fill="#0F2E5C" />
        <rect x={46} y={226} width={84} height={66} rx={3} fill="#0B2B5F" />
        <rect x={50} y={230} width={76} height={58} fill="url(#is-dawn)" />
        <rect className="is-day" x={50} y={230} width={76} height={58} fill="url(#is-day)" />
        <path d="M88 230v58M50 259h76" stroke="#0B2B5F" strokeWidth={3} />
        <rect x={150} y={238} width={70} height={4} rx={2} fill="#2A4A80" />
        <rect x={156} y={222} width={6} height={16} fill="#EF7D5E" /><rect x={163} y={226} width={6} height={12} fill="#5BB4E8" /><rect x={170} y={220} width={5} height={18} fill="#F2A93B" /><circle cx={204} cy={230} r={8} fill="#0E807C" />
        <path d="M58 400l-4-26h24l-4 26z" fill="#EF7D5E" /><circle cx={66} cy={364} r={13} fill="#0E807C" /><circle cx={58} cy={356} r={8} fill="#0B6F6C" />
        {/* Chair */}
        <rect x={146} y={290} width={7} height={56} rx={3} fill="#2A4A80" /><rect x={146} y={338} width={50} height={7} rx={3} fill="#2A4A80" /><rect x={168} y={345} width={5} height={48} fill="#2A4A80" /><rect x={152} y={392} width={38} height={4} rx={2} fill="#2A4A80" />
        {/* The person at work, until they get up */}
        <g className="is-sitter">
          <rect x={164} y={330} width={44} height={11} rx={5.5} fill={HERO.pants} />
          <rect x={198} y={334} width={11} height={60} rx={5.5} fill={HERO.pants} />
          <path d="M197 390h14a6 6 0 0 1 6 6h-20z" fill={HERO.shoe} />
          <rect x={159} y={282} width={25} height={54} rx={10} fill={HERO.top} transform="rotate(8 172 334)" />
          <rect x={177} y={268} width={7} height={10} fill={HERO.skin} />
          <circle cx={184} cy={262} r={11} fill={HERO.skin} />
          <path d="M173 265c-3-12 9-18 17-15 4 1 7 4 7 8-6-2-11-1-14 2l-3 9z" fill={HERO.hair} />
          <circle cx={190.5} cy={262} r={1.3} fill="#0B0F1A" />
        </g>
        {/* Desk, laptop, lamp, mug */}
        <rect x={196} y={330} width={98} height={6} rx={2} fill="#C98B4F" /><rect x={200} y={336} width={5} height={64} fill="#A86F3B" /><rect x={286} y={336} width={5} height={64} fill="#A86F3B" />
        <rect x={214} y={326} width={48} height={4} rx={2} fill="#CFD8E6" />
        <polygon className="is-screen-glow" points="266,298 262,325 186,334 180,262" fill="url(#is-screen)" opacity={0} />
        <polygon className="is-screen" points="259,327 263,327 270,295 266,295" fill="#CFD8E6" />
        <rect x={274} y={318} width={9} height={12} rx={2} fill="#fff" /><path d="M283 321a3 3 0 0 1 0 6" stroke="#fff" strokeWidth={2} fill="none" />
        <polygon className="is-lamp-glow" points="270,306 292,306 304,330 258,330" fill="url(#is-lamp)" opacity={0} />
        <path d="M289 330h-10m5 0l-6-24" stroke="#5B6B86" strokeWidth={3} strokeLinecap="round" /><path d="M268 306l6-10h10l6 10z" fill="#F2A93B" />
        <g className="is-sitter is-type">
          <path d="M180 290L194 316L220 321" stroke={HERO.top} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={221} cy={321} r={4} fill={HERO.skin} />
        </g>
        {/* Work arriving on screen */}
        <WorkCard kind="ticket" at={[206, 248]} className="is-homecard" style={d(0.7)} />
        <WorkCard kind="key" at={[234, 216]} className="is-homecard" style={d(1.15)} />
        <WorkCard kind="check" at={[250, 258]} className="is-homecard" style={d(1.6)} />
      </g>

      {/* Office: the entrance is the Rolevara door R. */}
      <g>
        <rect x={632} y={28} width={316} height={12} rx={2} fill="#0B2B5F" />
        <rect x={640} y={40} width={300} height={360} fill="#0F3266" />
        <rect x={920} y={40} width={20} height={360} fill="#0C2A57" />
        <path d="M700 28v-16m-4 0h8" stroke="#3D5F96" strokeWidth={3} strokeLinecap="round" />
        {WINDOWS.map(([c, r], i) => <rect key={i} x={660 + c * 34} y={56 + r * 34} width={22} height={22} rx={2} fill="#1A4580" />)}
        {WINDOWS.map(([c, r], i) => DARK.has(i) ? null : (
          <g key={i} className="is-lit" style={d(9 + ((i * 7) % 24) * 0.05)}>
            <rect x={660 + c * 34} y={56 + r * 34} width={22} height={22} rx={2} fill="#FFD58A" />
            {STAFFED.has(i) && <g fill="#0F3266" opacity={0.75}><circle cx={671 + c * 34} cy={68 + r * 34} r={3.5} /><rect x={665 + c * 34} y={72 + r * 34} width={12} height={6} rx={3} /></g>}
          </g>
        ))}
        {/* Inside the door: dark, then lit as the person walks up. */}
        <polygon points="726.9,206 798,233 798,347 726.9,347" fill="#071A33" />
        <g className="is-doorlight">
          <polygon points="726.9,206 798,233 798,347 726.9,347" fill="url(#is-doorlight)" />
          <polygon className="is-doorpulse" points="736,347 789,347 753,400 666,400" fill="#2DD4CF" opacity={0.5} filter="url(#is-blur)" />
        </g>
        <image href="/brand/rolevara-door.png" x={666} y={160} width={248.5} height={240} />
      </g>

      {/* The person walking to work, with their work alongside. */}
      <g className="is-walker">
        <Person look={HERO} className="walking" />
        <g className="is-bob">
          <WorkCard kind="ticket" at={[-58, -168, 0.8]} className="is-carry" style={d(2.5)} />
          <WorkCard kind="key" at={[-22, -182, 0.8]} className="is-carry" style={d(2.65)} />
          <WorkCard kind="check" at={[14, -168, 0.8]} className="is-carry" style={d(2.8)} />
        </g>
      </g>

      {/* Payoff */}
      <g className="is-toast">
        <rect x={490} y={172} width={136} height={38} rx={10} fill="#fff" />
        <circle cx={511} cy={191} r={10} fill="#00ADA8" /><path d="M506 191l3.5 3.5 6-6.5" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={528} y={196} fontFamily="Figtree Variable, Figtree, sans-serif" fontWeight={700} fontSize={14} fill="#0B2B5F">Shift started</text>
      </g>
    </svg>
  );
}
