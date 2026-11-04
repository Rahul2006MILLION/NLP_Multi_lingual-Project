import { Maximize2 } from "lucide-react";
import { useState } from "react";
import { assetUrl } from "../../services/api";
import type { Figure } from "../../services/types";
import { GlassCard } from "./GlassCard";
import { Modal } from "./Modal";

/**
 * Publication figure on a glass card. The PNGs have white backgrounds, so they sit on an
 * inset light plate rather than being inverted (inverting would change the plotted colours).
 * A missing figure renders nothing, as the Streamlit app did.
 */
export function FigureCard({ figure, className }: { figure: Figure | null | undefined; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!figure) return null;
  const src = assetUrl(figure.url);

  return (
    <>
      <GlassCard interactive className={"group flex flex-col p-3 sm:p-4 " + (className ?? "")}>
        <button
          onClick={() => setOpen(true)}
          className="relative block overflow-hidden rounded-[1rem] bg-white text-left"
          aria-label={`Enlarge ${figure.caption}`}
        >
          <img
            src={src}
            alt={figure.caption}
            loading="lazy"
            className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.015]"
          />
          <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <Maximize2 className="size-3.5" />
          </span>
        </button>
        <figcaption className="px-2 pb-1 pt-4 text-sm leading-relaxed text-fg-3">{figure.caption}</figcaption>
      </GlassCard>

      <Modal open={open} onClose={() => setOpen(false)} label={figure.caption} className="max-w-6xl p-4 pt-16 sm:p-6 sm:pt-16">
        <div className="overflow-hidden rounded-2xl bg-white">
          <img src={src} alt={figure.caption} className="h-auto w-full" />
        </div>
        <p className="px-1 pt-4 pr-12 text-sm text-fg-2">{figure.caption}</p>
      </Modal>
    </>
  );
}
