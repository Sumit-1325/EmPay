import { Separator } from "@/components/ui/separator";

function AuthShell({ title, subtitle, features, children }) {
  return (
    <main className="auth-grid-pattern relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-10">
      {/* Animated background orbs */}
      <div className="auth-orb-1 pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="auth-orb-2 pointer-events-none absolute -bottom-32 right-1/5 h-[380px] w-[380px] rounded-full bg-secondary/15 blur-[130px]" />
      <div className="auth-orb-3 pointer-events-none absolute top-1/2 left-2/3 h-[300px] w-[300px] rounded-full bg-pink-500/10 blur-[100px]" />

      {/* ─── Outer wrapper — single column, branding on top / form below ─── */}
      <div className="animate-fade-in relative z-10 mx-auto w-full max-w-2xl space-y-4">

        {/* ─── Top: Branding banner ─── */}
        <section className="rounded-3xl border border-border dark:border-white/[0.08] bg-gradient-to-br from-primary/[0.08] via-secondary/[0.06] to-transparent p-6 shadow-[0_0_60px_-20px_rgba(99,102,241,0.15)] sm:p-8">
          {/* Logo row */}
          <div className="mb-5 flex items-center gap-3 animate-slide-in-left">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-base font-bold text-white shadow-lg shadow-primary/25">
              E
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">EmPay</span>
          </div>

          {/* Title + subtitle */}
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary/80 uppercase">
            HRMS Platform
          </p>
          <h1 className="gradient-text mt-2 text-2xl font-bold leading-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>

          {/* Feature pills — horizontal scroll on mobile, wrap on desktop */}
          {features?.length > 0 && (
            <>
              <Separator className="my-5 bg-border dark:bg-white/[0.06]" />
              <div className="flex flex-wrap gap-2">
                {features.map((feature, i) => (
                  <div
                    key={feature.label}
                    className={`feature-pill animate-fade-up delay-${i + 1} flex items-center gap-2 rounded-full border border-border dark:border-white/[0.07] bg-muted/30 dark:bg-white/[0.03] px-3 py-1.5`}
                  >
                    <span
                      className="block h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: feature.dot, boxShadow: `0 0 6px ${feature.dot}60` }}
                    />
                    <span className="text-xs font-medium text-foreground dark:text-white/80 whitespace-nowrap">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ─── Bottom: Form card ─── */}
        <section className="rounded-3xl border border-border dark:border-white/[0.08] bg-card dark:bg-white/[0.03] backdrop-blur-xl px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          {children}
        </section>
      </div>
    </main>
  );
}

export { AuthShell };
