import { motion } from "framer-motion";
import { AlertCircle, FileQuestion, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={"inline-block rounded-full border-[1.5px] border-current border-t-transparent " + className}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
    />
  );
}

/** Shimmering placeholder blocks while a page payload loads. */
export function PageSkeleton() {
  return (
    <div className="pt-40" role="status" aria-label="Loading">
      <div className="mx-auto h-28 max-w-2xl animate-pulse rounded-3xl bg-white/[0.04]" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-3xl border border-white/[0.05] bg-white/[0.025]" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center pt-24" role="alert">
      <div className="glass max-w-md p-8 text-center">
        <AlertCircle className="mx-auto size-6 text-down" strokeWidth={1.5} />
        <h2 className="mt-4 text-lg font-medium">Something went wrong</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-2">{error.message}</p>
        {onRetry && (
          <Button onClick={onRetry} className="mt-6" icon={<RotateCw className="size-4" />}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-white/[0.1] text-fg-3">
        {icon ?? <FileQuestion className="size-5" strokeWidth={1.5} />}
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm leading-relaxed text-fg-3">{children}</div>}
    </div>
  );
}
