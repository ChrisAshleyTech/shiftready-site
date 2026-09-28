// Motion constants for the 21st "Animated Sidebar" (starc007). The component shipped without
// this file; values follow its comments (critically damped, no overshoot).
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
export const SPRING_LAYOUT = { type: "spring", stiffness: 520, damping: 42, mass: 0.8 } as const;
export const SPRING_PRESS = { type: "spring", stiffness: 700, damping: 32 } as const;
