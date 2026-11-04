import { motion } from "framer-motion";
import { ease } from "../../lib/motion";
import { pct } from "../../lib/format";

interface Props {
  label: string;
  help: string;
  value: number | null | undefined;
  delta?: number;
  /** τ marker drawn on the bar (Strategy E). */
  threshold?: number;
  emphasis?: boolean;
}

export function ConfidenceMeter({ label, help, value, delta, threshold, emphasis }: Props) {
  const isAvailable = value !== null && value !== undefined && !isNaN(value);
  const displayVal = isAvailable ? pct(value!) : "N/A";
  const barWidth = isAvailable ? `${Math.min(100, Math.max(0, value! * 100))}%` : "0%";

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/30 p-5" title={help}>
      <p className="text-xs text-fg-3">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={"tabular text-3xl font-semibold tracking-tight " + (emphasis ? "text-fg" : "text-fg/90")}>{displayVal}</span>
        {isAvailable && delta !== undefined && (
          <span className={"tabular whitespace-nowrap text-xs " + (delta >= 0 ? "text-up" : "text-down")}>
            {delta >= 0 ? "+" : ""}
            {(delta * 100).toFixed(1)}% vs Raw
          </span>
        )}
      </div>
      <div className="relative mt-4 h-1.5 overflow-visible rounded-full bg-white/[0.07]">
        <motion.div
          className={"absolute inset-y-0 left-0 rounded-full " + (emphasis ? "bg-white" : "bg-white/55")}
          initial={{ width: 0 }}
          animate={{ width: barWidth }}
          transition={{ duration: 0.9, ease }}
        />
        {threshold !== undefined && isAvailable && (
          <span
            className="absolute -top-1.5 h-4.5 w-px bg-down"
            style={{ left: `${threshold * 100}%` }}
            aria-label={`Threshold ${threshold.toFixed(2)}`}
          />
        )}
      </div>
      <p className="mt-3 text-[11px] leading-snug text-fg-3">{help}</p>
    </div>
  );
}
