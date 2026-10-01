// Original flat illustrations for Verdelit (drawn for this project, no third-party license).
// Decorative: aria-hidden, colours from the theme's brand hues so they follow light/dark mode.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ viewBox: "0 0 240 180", fill: "none", "aria-hidden": true as const, focusable: "false" as const, ...p });

/** A ticket queue being cleared: stacked tickets, a big check. Empty queue / "all done". */
export function IllusQueue(p: P) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="160" rx="92" ry="10" fill="var(--hue-blue)" opacity=".12" />
      <rect x="46" y="54" width="120" height="84" rx="14" fill="var(--hue-sky)" opacity=".35" transform="rotate(-8 106 96)" />
      <rect x="58" y="44" width="124" height="90" rx="14" fill="var(--card)" stroke="var(--hue-blue)" strokeWidth="3" />
      <rect x="72" y="60" width="26" height="12" rx="6" fill="var(--hue-pink)" />
      <rect x="104" y="61" width="62" height="10" rx="5" fill="var(--hue-blue)" opacity=".25" />
      <rect x="72" y="82" width="94" height="8" rx="4" fill="var(--hue-blue)" opacity=".15" />
      <rect x="72" y="98" width="70" height="8" rx="4" fill="var(--hue-blue)" opacity=".15" />
      <circle cx="176" cy="126" r="26" fill="var(--hue-green)" />
      <path d="M164 126l8 8 16-17" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="40" r="6" fill="var(--hue-amber)" /><circle cx="206" cy="46" r="4" fill="var(--hue-violet)" />
      <path d="M28 120l6 6m0-6l-6 6" stroke="var(--hue-pink)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** A magnifier over ID cards. No search results. */
export function IllusSearch(p: P) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="160" rx="88" ry="10" fill="var(--hue-blue)" opacity=".12" />
      {[0, 1, 2].map(i => (
        <g key={i} transform={`translate(${40 + i * 18} ${48 + i * 14})`}>
          <rect width="110" height="64" rx="12" fill="var(--card)" stroke="var(--hue-blue)" strokeOpacity={0.35 + i * 0.3} strokeWidth="2.5" />
          <circle cx="24" cy="32" r="12" fill={["var(--hue-amber)", "var(--hue-pink)", "var(--hue-sky)"][i]} />
          <rect x="44" y="22" width="52" height="8" rx="4" fill="var(--hue-blue)" opacity=".25" />
          <rect x="44" y="36" width="36" height="8" rx="4" fill="var(--hue-blue)" opacity=".15" />
        </g>
      ))}
      <circle cx="178" cy="70" r="30" fill="var(--hue-sky)" opacity=".25" stroke="var(--hue-blue)" strokeWidth="6" />
      <path d="M200 92l20 20" stroke="var(--hue-blue)" strokeWidth="10" strokeLinecap="round" />
      <path d="M170 62l16 16m0-16l-16 16" stroke="var(--hue-blue)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** A shield with a key and a person. Identity and access. */
export function IllusShield(p: P) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="162" rx="90" ry="10" fill="var(--hue-blue)" opacity=".12" />
      <path d="M120 22l58 20v42c0 38-26 62-58 74-32-12-58-36-58-74V42z" fill="var(--hue-blue)" />
      <path d="M120 34l46 16v34c0 30-20 50-46 60z" fill="var(--hue-sky)" opacity=".45" />
      <circle cx="120" cy="80" r="16" fill="#fff" /><path d="M96 124c4-16 14-24 24-24s20 8 24 24" fill="#fff" />
      <g transform="translate(168 108) rotate(-30)">
        <circle r="14" fill="var(--hue-amber)" /><circle r="5" fill="var(--card)" />
        <rect x="12" y="-4" width="38" height="8" rx="4" fill="var(--hue-amber)" /><rect x="38" y="2" width="6" height="10" rx="2" fill="var(--hue-amber)" />
      </g>
      <circle cx="44" cy="54" r="7" fill="var(--hue-pink)" /><circle cx="200" cy="36" r="5" fill="var(--hue-green)" />
    </svg>
  );
}

/** Rising bars and a ribbon badge. Results and reports. */
export function IllusChart(p: P) {
  const bars = [[52, 54, "var(--hue-sky)"], [84, 78, "var(--hue-blue)"], [116, 40, "var(--hue-violet)"], [148, 96, "var(--hue-blue)"]] as const;
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="160" rx="92" ry="10" fill="var(--hue-blue)" opacity=".12" />
      <rect x="34" y="30" width="172" height="124" rx="16" fill="var(--card)" stroke="var(--hue-blue)" strokeOpacity=".35" strokeWidth="2.5" />
      {bars.map(([x, h, c], i) => <rect key={i} x={x} y={140 - h} width="22" height={h} rx="6" fill={c} />)}
      <path d="M50 96l40-26 32 14 44-42" stroke="var(--hue-pink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(186 40)">
        <path d="M-10 18l-6 26 16-9 16 9-6-26" fill="var(--hue-pink)" />
        <circle r="20" fill="var(--hue-amber)" /><path d="M-8 0l5 5 11-11" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A resolved ticket, a reply saying it didn't work, and the arrow back into the queue. */
export function IllusReopen(p: P) {
  return (
    <svg {...base(p)}>
      <ellipse cx="120" cy="160" rx="92" ry="10" fill="var(--hue-blue)" opacity=".12" />
      <rect x="26" y="44" width="122" height="96" rx="16" fill="var(--card)" stroke="var(--hue-blue)" strokeWidth="2.5" />
      <rect x="42" y="62" width="58" height="9" rx="4.5" fill="var(--hue-blue)" />
      <rect x="42" y="80" width="88" height="7" rx="3.5" fill="var(--hue-blue)" opacity=".2" />
      <rect x="42" y="94" width="72" height="7" rx="3.5" fill="var(--hue-blue)" opacity=".2" />
      <g transform="translate(58 120)"><rect x="-16" y="-9" width="58" height="18" rx="9" fill="var(--hue-green)" /><path d="M-6 0l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
      <rect x="150" y="26" width="72" height="46" rx="14" fill="var(--hue-pink)" />
      <path d="M164 72l-6 12 16-12z" fill="var(--hue-pink)" />
      <rect x="164" y="40" width="44" height="7" rx="3.5" fill="#fff" opacity=".9" />
      <rect x="164" y="53" width="30" height="7" rx="3.5" fill="#fff" opacity=".7" />
      <path d="M196 84c4 44-34 66-74 62" stroke="var(--hue-amber)" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 8" fill="none" />
      <path d="M130 138l-10 8 11 6" stroke="var(--hue-amber)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
