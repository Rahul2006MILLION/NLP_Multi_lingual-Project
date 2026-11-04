import type { Transition, Variants } from "framer-motion";

export const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

export const page: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  // filter is cleared at the end: any lingering filter makes <main> a backdrop root and disables the glass blur.
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease }, transitionEnd: { filter: "none" } },
  exit: { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.25, ease } },
};

export const stagger: Variants = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

export const rise: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
