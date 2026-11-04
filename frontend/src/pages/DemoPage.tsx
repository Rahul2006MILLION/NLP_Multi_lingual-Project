import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoControls } from "../components/demo/DemoControls";
import { DemoResultPanel } from "../components/demo/DemoResultPanel";
import { PageShell } from "../components/layout/PageShell";
import { PageHero, PageIntro } from "../components/ui/PageHero";
import { useApi } from "../hooks/useApi";
import { stagger } from "../lib/motion";
import { api } from "../services/api";
import type { DemoOptions, DemoRequest, DemoResult } from "../services/types";

const sameRequest = (a: DemoRequest, b: DemoRequest) =>
  a.language === b.language &&
  a.example_index === b.example_index &&
  a.strategy === b.strategy &&
  a.tau === b.tau &&
  (a.custom_question || "") === (b.custom_question || "");

function DemoWorkbench({ options }: { options: DemoOptions }) {
  const [req, setReq] = useState<DemoRequest>({
    language: options.languages[0].code,
    example_index: 0,
    strategy: options.default_strategy,
    tau: options.tau.default,
  });
  const [result, setResult] = useState<{ req: DemoRequest; data: DemoResult } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inflight = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    inflight.current?.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    const sent = { ...req };
    setRunning(true);
    setError(null);
    setResult(null); // Clear previous result immediately so stale results are never shown
    api
      .runDemo(sent, ctrl.signal)
      .then((data) => setResult({ req: sent, data }))
      .catch((e: Error) => !ctrl.signal.aborted && setError(e))
      .finally(() => !ctrl.signal.aborted && setRunning(false));
  }, [req]);

  useEffect(() => () => inflight.current?.abort(), []);

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="grid items-stretch gap-4 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <DemoControls options={options} value={req} onChange={setReq} onRun={run} running={running} />
      </div>
      <div className="lg:col-span-7">
        <DemoResultPanel result={result?.data ?? null} running={running} error={error} stale={!!result && !sameRequest(result.req, req)} />
      </div>
    </motion.div>
  );
}

export function DemoPage() {
  const state = useApi((s) => api.demoOptions(s));
  return (
    <PageShell state={state}>
      {(options) => (
        <>
          <PageHero word="Live Demo" eyebrow="Multilingual answering & confidence gating">
            <DemoWorkbench options={options} />
          </PageHero>
          <p className="mx-auto mt-6 flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-fg-3">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Powered by local Gemma 3 4B through Ollama. Answers, verbalized confidence, and cross-lingual mitigation candidates are generated live on your machine with Model 2 calibration.
          </p>
          <PageIntro
            title="Interactive Multilingual Answering & Calibration Demo"
            subtitle="Test Gemma 3 4B across languages with real-time candidate verification and confidence gating"
          />
        </>
      )}
    </PageShell>
  );
}
