import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { page } from "../../lib/motion";
import type { AsyncState } from "../../hooks/useApi";
import { ErrorState, PageSkeleton } from "../ui/States";

/** Page wrapper: transition, max width, and the loading / error states for its API payload. */
export function PageShell<T>({ state, children }: { state: AsyncState<T>; children: (data: T) => ReactNode }) {
  return (
    <motion.main
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-[1180px] px-4 sm:px-6"
    >
      {state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : state.data ? (
        children(state.data)
      ) : (
        <PageSkeleton />
      )}
    </motion.main>
  );
}
