import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function AuthShell({ title, subtitle, features, children }) {
  return (
    <main className="auth-grid-pattern relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f172a] px-4 py-6 sm:px-6 lg:px-10">
      {/* Animated background orbs */}
      <div className="auth-orb-1 pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="auth-orb-2 pointer-events-none absolute -bottom-32 right-1/5 h-[380px] w-[380px] rounded-full bg-secondary/15 blur-[130px]" />
      <div className="auth-orb-3 pointer-events-none absolute top-1/2 left-2/3 h-[300px] w-[300px] rounded-full bg-pink-500/10 blur-[100px]" />

      {/* Outer container */}
      <section className="animate-fade-in relative mx-auto w-full max-w-[1280px] rounded-3xl border border-white/[0.08] bg-gradient-to-br from-primary/[0.08] via-secondary/[0.06] to-white/[0.02] p-3 shadow-[0_0_80px_-20px_rgba(99,102,241,0.15)] md:p-5 lg:p-6">
        <div className="grid min-h-[min(calc(100vh-4rem),720px)] gap-4 lg:grid-cols-[1.1fr_1fr]">

          {/* ─── Left Panel: Branding ─── */}
          <Card className="glass-card hidden overflow-hidden rounded-2xl border-white/[0.08] text-foreground lg:flex">
            <CardContent className="flex h-full flex-col justify-between p-8 xl:p-10">
              {/* Logo & brand */}
              <div className="animate-slide-in-left">
                <div className="mb-10 flex items-center gap-3">
                  <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg font-bold text-white shadow-lg shadow-primary/25">
                    E
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                  <span className="text-xl font-semibold tracking-tight text-white/90">EmPay</span>
                </div>

                <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-primary/80 uppercase">
                  HRMS Platform
                </p>
                <h1 className="gradient-text mt-3 max-w-sm text-3xl font-bold leading-tight xl:text-4xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
                  {subtitle}
                </p>
              </div>

              {/* Feature pills */}
              <div className="mt-auto space-y-2.5 pt-8">
                <Separator className="mb-4 bg-white/[0.06]" />
                <p className="mb-3 text-[0.65rem] font-semibold tracking-[0.2em] text-white/30 uppercase">
                  What you get
                </p>
                {features.map((feature, i) => (
                  <div
                    key={feature.label}
                    className={`feature-pill animate-fade-up delay-${i + 3} flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3`}
                  >
                    <span className="pulse-dot relative">
                      <span
                        className="block h-2 w-2 rounded-full"
                        style={{ background: feature.dot, boxShadow: `0 0 8px ${feature.dot}40` }}
                      />
                    </span>
                    <span className="text-sm font-medium text-white/80">{feature.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Right Panel: Form ─── */}
          <Card className="glass-card flex items-center rounded-2xl border-white/[0.08] text-foreground">
            <CardContent className="flex w-full items-center px-6 py-8 md:px-10 lg:px-12">
              {children}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

export { AuthShell };
