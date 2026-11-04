import { motion, type HTMLMotionProps } from "framer-motion";
import { rise } from "../../lib/motion";
import { cn } from "../../lib/format";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  /** Lift slightly and brighten the border on hover. */
  interactive?: boolean;
  /** Brighter surface for the emphasised card in a group. */
  highlight?: boolean;
}

export function GlassCard({ className, interactive, highlight, children, ...rest }: GlassCardProps) {
  return (
    <motion.div
      variants={rise}
      whileHover={interactive ? { y: -4, transition: { duration: 0.3 } } : undefined}
      className={cn(
        "glass glass-sheen",
        interactive && "transition-[border-color,background] duration-300 hover:border-white/[0.16]",
        highlight && "border-white/[0.16] bg-white/[0.07]",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/[0.07]", className)} />;
}
