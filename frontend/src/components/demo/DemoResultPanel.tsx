import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CircleCheck, Info, OctagonPause, ScanSearch } from "lucide-react";
import { useState } from "react";
import type { DemoResult } from "../../services/types";
import { ease } from "../../lib/motion";
import { CardDivider, GlassCard } from "../ui/GlassCard";
import { EmptyState, Spinner } from "../ui/States";
import { ConfidenceMeter } from "./ConfidenceMeter";

interface Props {
  result: DemoResult | null;
  running: boolean;
  error: Error | null;
  stale: boolean;
}

function StatusBadge({ result }: { result: DemoResult }) {
  const c = result.confidence;
  return result.status === "abstained" ? (
    <span className="inline-flex items-center gap-2 rounded-full border border-down/30 bg-down/10 px-3 py-1.5 text-xs text-down">
      <OctagonPause className="size-3.5" />
      STATUS: ABSTAINED (Confidence {c.calibrated.toFixed(2)} &lt; Threshold {result.tau.toFixed(2)})
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full border border-up/30 bg-up/10 px-3 py-1.5 text-xs text-up">
      <CircleCheck className="size-3.5" />
      STATUS: ANSWER VERIFIED &amp; DELIVERED
    </span>
  );
}

function Trace({ result }: { result: DemoResult }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm">
        <span className="flex items-center gap-2.5"><ScanSearch className="size-4 text-fg-3" /> Intermediate Candidate Inspection &amp; Grounding Trace</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}><ChevronDown className="size-4 text-fg-3" /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.35, ease } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <dl className="space-y-5 px-5 pb-5 text-sm">
              <div>
                <dt className="text-xs text-fg-3">Ground Truth Reference Evidence</dt>
                <dd className="mt-1.5 italic leading-relaxed text-fg-2">{result.evidence}</dd>
              </div>
              <div>
                <dt className="text-xs text-fg-3">Target Claims</dt>
                <dd className="mt-1.5 flex flex-wrap gap-2">
                  {result.claims.map((c) => (
                    <code key={c} className="rounded-lg bg-white/[0.05] px-2 py-1 font-mono text-xs text-fg-2">{c}</code>
                  ))}
                </dd>
              </div>
              {result.trace.map((t) => (
                <div key={t.label}>
                  <dt className="text-xs text-fg-3">{t.label}</dt>
                  <dd lang={t.label.includes("English") && t.label.startsWith("Stage 1") ? "en" : result.language} className="mt-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-fg">
                    {t.text}
                  </dd>
                </div>
              ))}
              {result.trace_note && <p className="text-xs text-fg-3">{result.trace_note}</p>}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DemoResultPanel({ result, running, error, stale }: Props) {
  return (
    <GlassCard className="flex h-full flex-col p-6 sm:p-7" aria-live="polite" aria-busy={running}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-2">Model Response &amp; Candidate Audit</p>
        {running && <Spinner className="size-4 text-fg-3" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">Output</p>
      <CardDivider className="my-6" />

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-down/25 bg-down/[0.07] px-4 py-3 text-sm text-down">
          {error.message}
        </div>
      )}

      {!result ? (
        <div className="flex flex-1 items-center justify-center">
          {running ? (
            <EmptyState title="Calibrating…" icon={<Spinner className="size-5" />}>Computing calibrated confidence on the backend.</EmptyState>
          ) : (
            <EmptyState title="No result yet">Choose a language, question and strategy, then press Generate &amp; Calibrate.</EmptyState>
          )}
        </div>
      ) : (
        <motion.div
          key={result.experiment_id || `${result.language}-${result.question_id}-${result.strategy}-${result.tau}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: stale || running ? 0.45 : 1, y: 0, transition: { duration: 0.4, ease } }}
          className="space-y-6"
        >
          {stale && !running && (
            <p className="flex items-center gap-2 text-xs text-fg-3"><Info className="size-3.5" /> Inputs changed since this run. Press Generate &amp; Calibrate to update.</p>
          )}
          <StatusBadge result={result} />

          {result.status === "abstained" ? (
            <div className="rounded-2xl border border-down/20 bg-down/[0.06] p-5 text-sm leading-relaxed text-fg-2">
              <strong className="font-medium text-fg">Abstention Notice:</strong> The model withheld answering because its calibrated reliability (
              {(result.confidence.calibrated * 100).toFixed(1)}%) is below your safety threshold ({(result.tau * 100).toFixed(1)}%).
            </div>
          ) : (
            <div>
              <p className="text-xs text-fg-3">Final Answer ({result.language_name})</p>
              <p lang={result.language} className="mt-2 text-balance text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
                {result.final_answer}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <ConfidenceMeter label="Raw Verbalized Conf" help="Self-reported confidence elicited from the model" value={result.confidence.raw_verbalized} />
            <ConfidenceMeter label="Statistical Conf (Tokens)" help="Geometric mean probability of generated content tokens" value={result.confidence.statistical} />
            <ConfidenceMeter
              label="Model 2 Calibrated Conf"
              help="Language-Shift Platt scaled probability"
              value={result.confidence.calibrated}
              delta={result.confidence.delta_vs_raw}
              threshold={result.strategy === "E" ? result.tau : undefined}
              emphasis
            />
          </div>

          <Trace result={result} />
        </motion.div>
      )}
    </GlassCard>
  );
}
