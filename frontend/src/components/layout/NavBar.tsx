import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { ease } from "../../lib/motion";
import { cn } from "../../lib/format";

function Logo() {
  return (
    <Link
      to="/"
      aria-label="Cross-Lingual Calibration home"
      className="grid size-9 shrink-0 place-items-center rounded-full border border-white/[0.14] bg-gradient-to-b from-white/20 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="7.5" />
        <path d="M8 13.5c1.6-3 6.4-3 8-0.8" />
      </svg>
    </Link>
  );
}

export function NavBar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.nav
        aria-label="Main"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { duration: 0.6, ease } }}
        className="flex items-center gap-1 rounded-full border border-white/[0.1] bg-black/55 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
      >
        <Logo />

        <ul className="hidden items-center lg:flex">
          {ROUTES.map((r) => (
            <li key={r.path}>
              <NavLink
                to={r.path}
                end={r.path === "/"}
                className={({ isActive }) =>
                  cn("relative block rounded-full px-3.5 py-2 text-[13px] transition-colors duration-200", isActive ? "text-fg" : "text-fg-3 hover:text-fg-2")
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-full bg-white/[0.08]"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span className="relative">{r.nav}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <span className="px-2 text-sm font-medium lg:hidden">Calibration</span>

        <Link
          to="/demo"
          className="ml-1 hidden h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-black transition hover:bg-white/90 sm:inline-flex"
        >
          <Sparkles className="size-3.5" />
          Try demo
        </Link>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-9 place-items-center rounded-full text-fg-2 hover:text-fg lg:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 -z-10 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease } }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
              className="glass absolute top-16 w-[min(92vw,360px)] p-2 lg:hidden"
            >
              {ROUTES.map((r, i) => (
                <NavLink
                  key={r.path}
                  to={r.path}
                  end={r.path === "/"}
                  className={({ isActive }) =>
                    cn("flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition", isActive ? "bg-white/[0.08] text-fg" : "text-fg-2 hover:bg-white/[0.04]")
                  }
                >
                  <span>{r.nav}</span>
                  <span className="tabular text-xs text-fg-3">0{i + 1}</span>
                </NavLink>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
