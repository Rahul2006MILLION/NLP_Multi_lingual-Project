import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/format";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

/** Pill segmented control with a sliding highlight. Keyboard: arrow keys move selection. */
export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
  label,
  className,
}: {
  id: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  const idx = options.findIndex((o) => o.value === value);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (idx + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKey}
      className={cn("flex gap-1 rounded-full border border-white/[0.08] bg-black/50 p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 rounded-full px-3 py-2 text-[13px] transition-colors duration-200",
              active ? "text-black" : "text-fg-2 hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
