import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/format";

type Variant = "primary" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-white text-black hover:bg-white/90 shadow-[0_8px_30px_-8px_rgba(255,255,255,0.35)]",
  ghost: "bg-black/60 text-fg border border-white/[0.12] hover:border-white/25 hover:bg-white/[0.04]",
};

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({ variant = "ghost", icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/** Same look as Button, for real links (downloads, routes rendered as <a>). */
export function ButtonLink({
  variant = "ghost",
  icon,
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; icon?: ReactNode }) {
  return (
    <a
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors duration-200",
        styles[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </a>
  );
}
