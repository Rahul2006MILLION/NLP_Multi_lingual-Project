import { motion } from "framer-motion";
import { Check, Play } from "lucide-react";
import type { DemoOptions, DemoRequest, StrategyKey } from "../../services/types";
import { cn } from "../../lib/format";
import { Button } from "../ui/Button";
import { CardDivider, GlassCard } from "../ui/GlassCard";
import { Segmented } from "../ui/Segmented";
import { Spinner } from "../ui/States";

interface Props {
  options: DemoOptions;
  value: DemoRequest;
  onChange: (v: DemoRequest) => void;
  onRun: () => void;
  running: boolean;
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm text-fg-2">{label}</label>
        {hint && <span className="text-xs text-fg-3">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Row in the style of the reference's feature list: round check marker + text. */
function ChoiceRow({ selected, onClick, children, name }: { selected: boolean; onClick: () => void; children: React.ReactNode; name: string }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      data-group={name}
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left text-[13px] leading-snug transition-colors duration-200",
        selected ? "bg-white/[0.06] text-fg" : "text-fg-3 hover:bg-white/[0.03] hover:text-fg-2",
      )}
    >
      <span
        className={cn(
          "mt-px grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-200",
          selected ? "border-white bg-white text-black" : "border-white/[0.15] bg-white/[0.03] text-transparent group-hover:text-fg-3",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </button>
  );
}

export function DemoControls({ options, value, onChange, onRun, running }: Props) {
  const set = <K extends keyof DemoRequest>(k: K, v: DemoRequest[K]) => onChange({ ...value, [k]: v });
  const { min, max, step } = options.tau;
  const fill = ((value.tau - min) / (max - min)) * 100;

  return (
    <GlassCard className="flex h-full flex-col p-6 sm:p-7">
      <p className="text-sm text-fg-2">Input Configuration</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">Prompt setup</p>
      <CardDivider className="my-6" />

      <div className="space-y-7">
        <Field label="Target Language">
          <Segmented
            id="lang"
            label="Target Language"
            value={value.language}
            onChange={(v) => set("language", v)}
            options={options.languages.map((l) => ({ value: l.code, label: <span lang={l.code}>{l.native}</span>, title: `${l.name} (${l.script})` }))}
            className="[&_button]:px-1.5"
          />
        </Field>

        <Field label="Benchmark Question">
          <div role="radiogroup" aria-label="Benchmark Question" className="-mx-3 space-y-0.5">
            {options.examples.map((ex) => (
              <ChoiceRow key={ex.id} name="question" selected={value.example_index === ex.index} onClick={() => set("example_index", ex.index)}>
                <span className="block text-[11px] uppercase tracking-wider text-fg-3">{ex.domain} · {ex.id}</span>
                {ex.question_en}
              </ChoiceRow>
            ))}
          </div>
        </Field>

        <Field label="Mitigation Strategy">
          <div role="radiogroup" aria-label="Mitigation Strategy" className="-mx-3 space-y-0.5">
            {options.strategies.map((s) => (
              <ChoiceRow key={s.key} name="strategy" selected={value.strategy === s.key} onClick={() => set("strategy", s.key as StrategyKey)}>
                {s.label}
              </ChoiceRow>
            ))}
          </div>
        </Field>

        <Field label="Selective Abstention Threshold (τ)" htmlFor="tau" hint={value.strategy === "E" ? "Active for Strategy E" : "Only used by Strategy E"}>
          <div className="flex items-center gap-4">
            <input
              id="tau"
              type="range"
              min={min}
              max={max}
              step={step}
              value={value.tau}
              onChange={(e) => set("tau", Math.round(Number(e.target.value) * 100) / 100)}
              className="range"
              style={{ ["--fill" as string]: `${fill}%` }}
            />
            <motion.span key={value.tau} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="tabular w-11 text-right font-mono text-sm">
              {value.tau.toFixed(2)}
            </motion.span>
          </div>
        </Field>
      </div>

      <Button
        variant="primary"
        className="mt-8 w-full"
        onClick={onRun}
        disabled={running}
        icon={running ? <Spinner /> : <Play className="size-4" />}
      >
        {running ? "Calibrating…" : "Generate & Calibrate"}
      </Button>
    </GlassCard>
  );
}
