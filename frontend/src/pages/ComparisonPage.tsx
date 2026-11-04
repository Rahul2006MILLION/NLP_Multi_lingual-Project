import { motion } from "framer-motion";
import { PageShell } from "../components/layout/PageShell";
import { FigureCard } from "../components/ui/FigureCard";
import { GlassCard } from "../components/ui/GlassCard";
import { PageHero, PageIntro, SectionMarker } from "../components/ui/PageHero";
import { useApi } from "../hooks/useApi";
import { ease, stagger } from "../lib/motion";
import { fixed, pct, pctRaw, signed } from "../lib/format";
import { api } from "../services/api";
import type { ComparisonRow } from "../services/types";

/** Baseline → mitigated accuracy as two stacked bars. */
function AccuracyBars({ row }: { row: ComparisonRow }) {
  return (
    <div className="w-28 space-y-1" aria-hidden>
      {[
        { v: row.baseline_acc, c: "bg-white/30" },
        { v: row.mitigated_acc, c: "bg-white" },
      ].map((b, i) => (
        <div key={i} className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div className={"h-full rounded-full " + b.c} initial={{ width: 0 }} animate={{ width: `${b.v * 100}%` }} transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease }} />
        </div>
      ))}
    </div>
  );
}

const HEADERS = ["Language", "Baseline Acc", "Mitigated Acc", "", "Accuracy Gain", "Rel. Error Red.", "Baseline ECE", "Mitigated ECE", "ECE Reduction"];

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] text-xs text-fg-3">
              {HEADERS.map((h, i) => (
                <th key={i} scope="col" className={"px-5 py-4 font-normal " + (i === 0 ? "pl-7" : "")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.025]">
                <th scope="row" className="py-4 pl-7 pr-5 font-medium">
                  {r.language} <span className="font-mono text-xs font-normal text-fg-3">({r.code})</span>
                </th>
                <td className="px-5 py-4 text-fg-2">{pct(r.baseline_acc)}</td>
                <td className="px-5 py-4">{pct(r.mitigated_acc)}</td>
                <td className="px-5 py-4"><AccuracyBars row={r} /></td>
                <td className={"px-5 py-4 " + (r.accuracy_gain_pp >= 0 ? "text-up" : "text-down")}>{signed(r.accuracy_gain_pp)} pp</td>
                <td className="px-5 py-4 text-fg-2">{r.rel_error_reduction === null ? "—" : pctRaw(r.rel_error_reduction)}</td>
                <td className="px-5 py-4 text-fg-2">{fixed(r.baseline_ece)}</td>
                <td className="px-5 py-4">{fixed(r.mitigated_ece)}</td>
                <td className={"px-5 py-4 " + (r.ece_reduction >= 0 ? "text-up" : "text-down")}>{pctRaw(r.ece_reduction)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

export function ComparisonPage() {
  const state = useApi((s) => api.comparison(s));
  return (
    <PageShell state={state}>
      {(d) => (
        <>
          <PageHero word="Mitigation" eyebrow="Held-out P_test · English + 4 Indic languages">
            <motion.div variants={stagger} initial="initial" animate="animate">
              <ComparisonTable rows={d.rows} />
            </motion.div>
          </PageHero>
          <PageIntro title={d.title} subtitle={d.subtitle} />

          <SectionMarker label="Accuracy" />
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="grid gap-4 md:grid-cols-2">
            <FigureCard figure={d.figures.fig1} />
            <FigureCard figure={d.figures.fig2} />
          </motion.div>

          <SectionMarker label="Calibration error" />
          <motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, margin: "-60px" }} className="grid gap-4 md:grid-cols-2">
            <FigureCard figure={d.figures.fig4} />
            <FigureCard figure={d.figures.fig5} />
          </motion.div>
        </>
      )}
    </PageShell>
  );
}
