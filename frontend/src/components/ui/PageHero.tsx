import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ease } from "../../lib/motion";

interface PageHeroProps {
  /** Oversized decorative word that sits behind the first row of glass cards. */
  word: string;
  eyebrow: string;
  /** First content row; it overlaps the lower half of the word. */
  children: ReactNode;
}

export function PageHero({ word, eyebrow, children }: PageHeroProps) {
  // Fit the word to the content width: Poppins semibold averages ~0.6em per glyph.
  const fontSize = `min(13rem, calc(min(100vw - 32px, 1180px) / ${(word.length * 0.6).toFixed(2)}))`;
  return (
    <section className="relative pt-28 sm:pt-32">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease } }}
        className="eyebrow text-center"
      >
        {eyebrow}
      </motion.p>
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease }, transitionEnd: { filter: "none" } }}
        className="pointer-events-none select-none text-center font-semibold leading-[0.9] tracking-[-0.045em]"
        style={{ fontSize }}
      >
        <span className="bg-gradient-to-b from-white via-white to-white/60 bg-clip-text text-transparent">{word}</span>
      </motion.div>
      <div className="relative z-10 -mt-[0.28em] sm:-mt-[0.45em]" style={{ fontSize }}>
        <div className="text-base">{children}</div>
      </div>
    </section>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-pretty text-base leading-relaxed text-fg-2">{subtitle}</p>
    </div>
  );
}

/** Small pill label with hairline connectors, echoing the "Plans" marker in the reference. */
export function SectionMarker({ label }: { label: string }) {
  return (
    <div className="relative mt-24 mb-10 flex items-center justify-center">
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
      <h2 className="relative rounded-full border border-white/[0.1] bg-ink-2 px-4 py-1.5 text-xs font-normal text-fg-2">{label}</h2>
    </div>
  );
}
