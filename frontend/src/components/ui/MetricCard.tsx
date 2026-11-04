import { TrendingDown, TrendingUp } from "lucide-react";
import type { MetricCard as Metric } from "../../services/types";
import { GlassCard, CardDivider } from "./GlassCard";

/** Headline stat card. "danger" marks a failure finding, "success" a mitigation result. */
export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.tone === "danger" ? TrendingDown : TrendingUp;
  return (
    <GlassCard interactive className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-2">{metric.label}</p>
        <span
          className={
            "grid size-7 shrink-0 place-items-center rounded-full border border-white/[0.1] " +
            (metric.tone === "danger" ? "text-down" : "text-up")
          }
          aria-label={metric.tone === "danger" ? "Failure finding" : "Mitigation result"}
        >
          <Icon className="size-3.5" strokeWidth={2} />
        </span>
      </div>
      <p className="tabular mt-5 text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-[1.9rem]">{metric.value}</p>
      <CardDivider className="my-5" />
      <p className="mt-auto text-sm leading-relaxed text-fg-3">{metric.note}</p>
    </GlassCard>
  );
}
