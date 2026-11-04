import { motion } from "framer-motion";
import { PageShell } from "../components/layout/PageShell";
import { FigureCard } from "../components/ui/FigureCard";
import { CardDivider, GlassCard } from "../components/ui/GlassCard";
import { Markdown } from "../components/ui/Markdown";
import { PageHero, PageIntro, SectionMarker } from "../components/ui/PageHero";
import { useApi } from "../hooks/useApi";
import { stagger } from "../lib/motion";
import { api } from "../services/api";
import type { Calibration } from "../services/types";

/** Rendered through the shared markdown/KaTeX pipeline (st.latex equivalent). */
function Formula({ latex }: { latex: string }) {
  return <Markdown inline className="text-[1.15rem] text-fg sm:text-[1.35rem]">{`$$\n${latex}\n$$`}</Markdown>;
}

/** Same values and 3-decimal formatting as the Streamlit code block. */
const fmtParam = (v: number, i: number) => (i === 1 ? `+${v.toFixed(3)}` : v.toFixed(3));

function Parameters({ d }: { d: Calibration }) {
  return (
    <GlassCard className="h-full p-6 sm:p-7">
      <Markdown inline className="text-sm text-fg-2">{d.parameters_md}</Markdown>
      <CardDivider className="my-5" />
      <ul className="space-y-1 font-mono text-sm">
        {d.parameters.map((p, i) => (
          <li key={p.name} className="flex items-center justify-between gap-4 rounded-xl px-3 py-2 hover:bg-white/[0.03]">
            <span className="text-fg-2">{p.name}</span>
            <span className="tabular">
              {fmtParam(p.value, i)}
              {p.reference && <span className="ml-2 text-xs text-fg-3">(reference)</span>}
            </span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function CalibrationPage() {
  const state = useApi((s) => api.calibration(s));
  return (
    <PageShell state={state}>
      {(d) => (
        <>
          <PageHero word="Reliability" eyebrow="Model 2 · Language-Shift Platt Scaling">
            <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 lg:grid-cols-5">
              <GlassCard className="p-6 sm:p-8 lg:col-span-3">
                <p className="text-sm text-fg-2">Mathematical Formulation of Model 2 (Language-Shift Platt Scaling)</p>
                <CardDivider className="my-5" />
                <Formula latex={d.formula_latex} />
                <CardDivider className="my-5" />
                <Markdown inline className="text-[0.95rem] leading-relaxed text-fg-2">{d.explanation_md}</Markdown>
              </GlassCard>
              <div className="lg:col-span-2">
                <Parameters d={d} />
              </div>
            </motion.div>
          </PageHero>
          <PageIntro title={d.title} subtitle={d.subtitle} />

          <SectionMarker label="Reliability diagrams" />
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }}>
            <FigureCard figure={d.figures.fig7} />
          </motion.div>

          <SectionMarker label="Confidence distributions & misalignment" />
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="grid gap-4 md:grid-cols-2">
            <FigureCard figure={d.figures.fig6} />
            <FigureCard figure={d.figures.fig9} />
          </motion.div>
        </>
      )}
    </PageShell>
  );
}
