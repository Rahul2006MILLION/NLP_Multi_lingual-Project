import { Cpu, Database } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api";

/** Carries the information the Streamlit sidebar showed under the navigation. */
export function Footer() {
  const { data } = useApi((s) => api.meta(s));
  if (!data) return <footer className="h-24" />;

  return (
    <footer className="mx-auto mt-32 w-full max-w-[1180px] px-4 pb-10 sm:px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <div className="grid gap-8 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-medium">{data.title}</p>
          <p className="mt-1.5 text-fg-3">{data.caption}</p>
        </div>
        <div>
          <p className="eyebrow flex items-center gap-2"><Cpu className="size-3.5" /> Hardware platform</p>
          {data.hardware.map((l) => (
            <p key={l} className="tabular mt-2 font-mono text-xs text-fg-2">{l}</p>
          ))}
        </div>
        <div>
          <p className="eyebrow flex items-center gap-2"><Database className="size-3.5" /> Benchmark partitions</p>
          {data.partitions.map((l) => (
            <p key={l} className="tabular mt-2 font-mono text-xs text-fg-2">{l}</p>
          ))}
        </div>
      </div>
      <p className="text-xs text-fg-3">{data.footer}</p>
    </footer>
  );
}
