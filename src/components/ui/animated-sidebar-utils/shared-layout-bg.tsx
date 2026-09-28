// Stand-in for the 21st sidebar's SharedLayoutBg helper, which wasn't included with the
// component. It renders the list element; hover and active backgrounds come from the menu
// buttons themselves, so the pill props are accepted and ignored.
import { createElement, forwardRef, type HTMLAttributes, type ElementType } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  inset?: number;
  pillClassName?: string;
  pillContainerClassName?: string;
};

export const SharedLayoutBg = forwardRef<HTMLElement, Props>(function SharedLayoutBg(
  { as = "div", inset: _inset, pillClassName: _p, pillContainerClassName: _c, ...props },
  ref,
) {
  return createElement(as, { ...props, ref });
});
