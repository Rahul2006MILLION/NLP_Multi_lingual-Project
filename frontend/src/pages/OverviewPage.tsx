import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { FigureCard } from "../components/ui/FigureCard";
import { GlassCard } from "../components/ui/GlassCard";
import { Markdown } from "../components/ui/Markdown";
import { MetricCard } from "../components/ui/MetricCard";
import { PageHero, PageIntro, SectionMarker } from "../components/ui/PageHero";
import { useApi } from "../hooks/useApi";
import { stagger } from "../lib/motion";
import { api } from "../services/api";

export function OverviewPage() {
  const state = useApi((s) => api.overview(s));
  return (
    <PageShell state={state}>
      {(d) => (
        <>
          <PageHero word="Calibration" eyebrow="Gemma 3 4B Instruct · 5 languages · 4,050 inferences">
            <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.metrics.map((m) => (
                <MetricCard key={m.label} metric={m} />
              ))}
            </motion.div>
          </PageHero>

          <PageIntro title={d.title} subtitle={d.subtitle} />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/demo" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90">
              Open live demo <ArrowRight className="size-4" />
            </Link>
            <Link to="/report" className="inline-flex h-11 items-center rounded-full border border-white/[0.12] bg-black/60 px-6 text-sm font-medium transition hover:border-white/25">
              Read the paper
            </Link>
          </div>

          <SectionMarker label="Research Abstract & Motivation" />
          <GlassCard initial="initial" whileInView="animate" viewport={{ once: true, margin: "-80px" }} className="mx-auto max-w-4xl p-7 sm:p-10">
            <Markdown className="text-[1.02rem] leading-[1.85]">{d.abstract_md}</Markdown>
          </GlassCard>

          <SectionMarker label="Four Core Research Questions" />
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-80px" }} className="grid gap-4 md:grid-cols-2">
            {d.research_questions.map((rq) => (
              <GlassCard key={rq.code} interactive className="p-7 sm:p-8">
                <span className="tabular font-mono text-xs text-fg-3">{rq.code}</span>
                <h3 className="mt-3 text-xl font-medium tracking-tight">{rq.title}</h3>
                <p className="mt-3 leading-relaxed text-fg-2">{rq.body}</p>
              </GlassCard>
            ))}
          </motion.div>

          {d.figures.architecture && (
            <>
              <SectionMarker label="End-to-End Mitigation Architecture" />
              <motion.div initial="initial" whileInView="animate" viewport={{ once: true }}>
                <FigureCard figure={d.figures.architecture} />
              </motion.div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
