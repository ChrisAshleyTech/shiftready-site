// Stand-in for the 21st Financial Hero's TimelineAnimation helper (not shipped with it):
// staggered fade-and-rise as the element scrolls into view. With reduced motion, renders statically.
import { createElement, type ReactNode, type RefObject } from "react";
import { motion, useReducedMotion } from "motion/react";

type Tag = "div" | "h1" | "p" | "section" | "figure";
const MOTION = { div: motion.div, h1: motion.h1, p: motion.p, section: motion.section, figure: motion.figure };

export function TimelineAnimation({ as = "div", animationNum = 0, timelineRef, className, children, ...rest }:
  { as?: Tag; animationNum?: number; timelineRef?: RefObject<HTMLElement | null>; className?: string; children?: ReactNode; [k: string]: unknown }) {
  const reduce = useReducedMotion();
  if (reduce) return createElement(as, { className, ...rest }, children);
  const M = MOTION[as] as typeof motion.div;
  return (
    <M className={className} {...rest}
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, root: timelineRef, amount: 0.2 }}
      transition={{ duration: 0.5, delay: animationNum * 0.08, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </M>
  );
}
