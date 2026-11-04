import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { FigureCard } from "../components/ui/FigureCard";
import { CardDivider, GlassCard } from "../components/ui/GlassCard";
import { PageHero, PageIntro, SectionMarker } from "../components/ui/PageHero";
import { useApi } from "../hooks/useApi";
import { stagger } from "../lib/motion";
import { api } from "../services/api";
import type { Experiments } from "../services/types";

type Row = Experiments["validation_table"][number];

/** One validation strategy, laid out like a tier card: headline accuracy, then the measured attributes. */
function StrategyCard({ row }: { row: Row }) {
  const [code, ...rest] = row.strategy.split(": ");
  const name = rest.join(": ");
  const winner = row.selected.startsWith("YES");

  return (
    <GlassCard interactive highlight={winner} className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-fg-2">{code}</p>
        {winner && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-black">
            <Crown className="size-3" /> Winner
          </span>
        )}
      </div>
      <p className="mt-1 min-h-[2.75rem] text-[13px] leading-snug text-fg-3">{name}</p>
      <p className="tabular mt-4 text-[2.6rem] font-semibold leading-none tracking-tight">
        {row.validation_acc}
        <span className="ml-1 text-base font-normal text-fg-3">acc</span>
      </p>
      <CardDivider className="my-6" />
      <dl className="space-y-4 text-[13px]">
        {[
          ["Validation Brier Score", row.validation_brier],
          ["Avg Latency", row.avg_latency],
          ["Selected", row.selected],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="grid size-5 shrink-0 place-items-center rounded-full border border-white/[0.15] bg-white/[0.04]">
              <Check className="size-3 text-fg-2" strokeWidth={2.5} />
            </span>
            <dt className="text-fg-3">{k}</dt>
            <dd className="tabular ml-auto text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}

export function ExperimentsPage() {
  const state = useApi((s) => api.experiments(s));
  return (
    <PageShell state={state}>
      {(d) => (
        <>
          <PageHero word="Strategies" eyebrow="Stage A: Validation Strategy Selection (P_val)">
            <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.validation_table.map((r) => (
                <StrategyCard key={r.strategy} row={r} />
              ))}
            </motion.div>
          </PageHero>
          <PageIntro title={d.title} subtitle={d.subtitle} />

          <SectionMarker label="Strategy E: Selective answering" />
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="grid gap-4 md:grid-cols-2">
            <FigureCard figure={d.figures.fig10} />
            <FigureCard figure={d.figures.fig11} />
          </motion.div>

          <SectionMarker label="Strategy comparison & latency" />
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="grid gap-4 md:grid-cols-2">
            <FigureCard figure={d.figures.fig12} />
            <FigureCard figure={d.figures.fig13} />
          </motion.div>
        </>
      )}
    </PageShell>
  );
}
