/** Fixed ambient light behind everything: a soft top glow and a faint floor reflection. */
export function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute left-1/2 top-[-18rem] h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-white/[0.07] blur-[120px]" />
      <div className="absolute left-[8%] top-[30%] h-[22rem] w-[22rem] rounded-full bg-white/[0.025] blur-[100px]" />
      <div className="absolute right-[6%] top-[55%] h-[26rem] w-[26rem] rounded-full bg-white/[0.02] blur-[110px]" />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
