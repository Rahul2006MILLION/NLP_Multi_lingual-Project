import { motion } from "framer-motion";
import { PageShell } from "../components/layout/PageShell";
import { FigureCard } from "../components/ui/FigureCard";
import { GlassCard } from "../components/ui/GlassCard";
import { Markdown } from "../components/ui/Markdown";
import { MetricCard } from "../components/ui/MetricCard";
import { PageHero, PageIntro, SectionMarker } from "../components/ui/PageHero";
import { useApi } from "../hooks/useApi";
import { stagger } from "../lib/motion";
import { api } from "../services/api";

export function ConsistencyPage() {
  const state = useApi((s) => api.consistency(s));
  return (
    <PageShell state={state}>
      {(d) => (
        <>
          <PageHero word="Consistency" eyebrow="750 pairwise comparisons · LLM judge vs evidence">
            <motion.div variants={stagger} initial="initial" animate="animate" className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
              {d.metrics.map((m) => (
                <MetricCard key={m.label} metric={m} />
              ))}
            </motion.div>
          </PageHero>
          <PageIntro title={d.title} subtitle={d.subtitle} />

          {d.figures.fig8 && (
            <>
              <SectionMarker label="Agreement before & after mitigation" />
              <motion.div initial="initial" whileInView="animate" viewport={{ once: true }}>
                <FigureCard figure={d.figures.fig8} />
              </motion.div>
            </>
          )}

          <SectionMarker label="Qualitative Error Audit: Why Surface Agreement Misleads" />
          <p className="mx-auto max-w-2xl text-center text-fg-2">{d.audit_intro}</p>
          <motion.div role="list" variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="mt-8 grid gap-4 md:grid-cols-3">
            {d.audit_items.map((item, i) => (
              <GlassCard key={item.title} role="listitem" interactive className="p-7">
                <span className="tabular grid size-8 place-items-center rounded-full border border-white/[0.12] font-mono text-xs text-fg-2">{i + 1}</span>
                <h3 className="mt-5 text-lg font-medium leading-snug tracking-tight">{item.title}</h3>
                <Markdown inline className="mt-3 text-sm leading-relaxed text-fg-2">{item.body_md}</Markdown>
              </GlassCard>
            ))}
          </motion.div>
        </>
      )}
    </PageShell>
  );
}
