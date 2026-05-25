/**
 * Landing — clean, Stripe-class agritech landing.
 *
 * Layout principles:
 *   - White background, generous whitespace
 *   - Calm green accents (leaf), soft earth tones for support
 *   - Headline + subhead + 2 CTAs + trust stats on the left
 *   - A clean product-preview card on the right (no 3D, no clutter)
 *   - Subtle fade/slide-in entrance only; nothing else moves
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BadgeCheck,
  CloudSun, Leaf, Menu, Sparkles, Sprout, X, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-ink antialiased">
      <Nav />
      <Hero />
      <LogoStrip />
    </div>
  );
}

/* ============================================================ */
/*                              NAV                              */
/* ============================================================ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: Array<{ label: string; to: string }> = [
    { label: "Diagnose",  to: "/diagnose" },
    { label: "Advisory",  to: "/advisory" },
    { label: "Mandi",     to: "/mandi" },
    { label: "Assistant", to: "/chat" },
    { label: "Library",   to: "/library" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors ${
        scrolled ? "border-b border-black/[0.06] bg-white/85 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-700 text-white shadow-[0_2px_6px_-2px_rgba(31,124,66,0.5)]">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="font-display text-[16px] font-semibold tracking-tight text-ink">KisanCare</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Link to={l.to} className="rounded-md px-3 py-2 text-[14px] font-medium text-ink-muted transition hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/diagnose" className="rounded-md px-3 py-2 text-[14px] font-medium text-ink-muted transition hover:text-ink">
            Sign in
          </Link>
          <Link
            to="/diagnose"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(11,31,23,0.10),0_4px_12px_-4px_rgba(11,31,23,0.30)] transition hover:bg-leaf-800"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.08] bg-white text-ink md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white md:hidden"
          >
            <div className="mx-auto flex max-w-md flex-col gap-3 px-6 pt-8">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl font-semibold text-ink">KisanCare</p>
                <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 text-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-6 space-y-1">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base font-medium text-ink transition hover:bg-black/[0.04]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/diagnose" onClick={() => setMobileOpen(false)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ============================================================ */
/*                              HERO                             */
/* ============================================================ */
function Hero() {
  const fade = {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
  };
  const stagger = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  return (
    <section className="relative">
      {/* very subtle warm wash at the top so it isn't pure cold white */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{ background: "linear-gradient(180deg, #f6f7f3 0%, #ffffff 100%)" }} />

      <div className="mx-auto max-w-6xl px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.02fr] lg:gap-20">

          {/* LEFT — copy */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fade}
              className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-leaf-50 px-3 py-1 text-[12px] font-medium text-leaf-800">
              <Sparkles className="h-3 w-3" />
              New · AI plant doctor for Indian farmers
            </motion.div>

            <motion.h1 variants={fade}
              className="mt-7 font-display text-[42px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px] lg:text-[60px]">
              Healthier crops.{" "}
              <span className="text-leaf-700">Smarter farms.</span>
            </motion.h1>

            <motion.p variants={fade}
              className="mt-6 max-w-[520px] text-[17px] leading-[1.65] text-ink-muted">
              Take one photo of a leaf. KisanCare uses AI to identify crop disease,
              recommend organic and chemical treatments, and tell you exactly when
              to spray — all in your language.
            </motion.p>

            <motion.div variants={fade} className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/diagnose"
                className="group inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(11,31,23,0.12),0_8px_24px_-8px_rgba(11,31,23,0.35)] transition hover:bg-leaf-800 hover:shadow-[0_2px_4px_rgba(11,31,23,0.16),0_12px_28px_-8px_rgba(11,31,23,0.45)]"
              >
                Try the demo
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/library"
                className="group inline-flex items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-5 py-3 text-[15px] font-semibold text-ink transition hover:border-black/[0.18] hover:bg-surface-2"
              >
                See how it works
                <ArrowUpRight className="h-3.5 w-3.5 opacity-50 transition group-hover:opacity-90" />
              </Link>
            </motion.div>

            <motion.dl variants={fade}
              className="mt-12 grid max-w-md grid-cols-4 gap-x-6 border-t border-black/[0.06] pt-6">
              <Stat label="accuracy"   value="99.17%" />
              <Stat label="response"   value="<200ms" />
              <Stat label="languages"  value="EN / हिं" />
              <Stat label="for farmer" value="₹0" />
            </motion.dl>
          </motion.div>

          {/* RIGHT — product preview */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.25 }}
            className="relative"
          >
            <ProductPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 font-display text-[18px] font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

/* ============================================================ */
/*                       PRODUCT PREVIEW                         */
/* ============================================================ */
function ProductPreview() {
  return (
    <div className="relative">
      {/* faint background bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[40px]"
        style={{ background: "radial-gradient(60% 60% at 50% 30%, rgba(139,208,159,0.20), transparent 70%)" }}
      />

      {/* MAIN CARD — clean diagnosis result */}
      <div
        className="relative rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-7"
        style={{ boxShadow: "0 1px 1px rgba(11,31,23,0.04), 0 16px 40px -12px rgba(11,31,23,0.18), 0 4px 12px -4px rgba(11,31,23,0.08)" }}
      >
        {/* top — leaf thumb + diagnosis */}
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/[0.04]"
               style={{ background: "linear-gradient(135deg, #dcf3e2, #bbe5c7)" }}>
            <Leaf className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-leaf-700"
                  strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Diagnosis</p>
            <h3 className="mt-0.5 font-display text-[22px] font-semibold leading-tight text-ink">
              Tomato Early Blight
            </h3>
            <p className="mt-1 text-[12.5px] italic text-ink-muted">Alternaria solani · fungus</p>
          </div>
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-red-700">
            Severe
          </span>
        </div>

        {/* confidence */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Confidence</p>
            <p className="font-display text-[15px] font-semibold tabular-nums text-leaf-800">92%</p>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
            <motion.div
              initial={{ width: "0%" }} animate={{ width: "92%" }}
              transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-leaf-700"
            />
          </div>
        </div>

        {/* treatment row */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <TreatmentPill
            label="Organic"
            name="Neem Oil 0.03%"
            note="₹450 · 3 sprays"
            tone="leaf"
            icon={<Leaf className="h-3.5 w-3.5" />}
          />
          <TreatmentPill
            label="Chemical"
            name="Mancozeb 75% WP"
            note="₹600 · PHI 7d"
            tone="earth"
            icon={<Zap className="h-3.5 w-3.5" />}
          />
        </div>

        {/* footer — next action */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-leaf-50">
              <CloudSun className="h-3.5 w-3.5 text-leaf-700" />
            </div>
            <div className="leading-tight">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">Best spray</p>
              <p className="text-[13px] font-semibold text-ink">Tomorrow · 06:00</p>
            </div>
          </div>
          <Link to="/diagnose" className="group inline-flex items-center gap-1 text-[13px] font-semibold text-leaf-700 hover:text-leaf-800">
            View full plan
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* SECONDARY CARD — small floating stat */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] as const }}
        className="absolute -bottom-7 left-6 sm:left-8 hidden sm:block"
      >
        <div
          className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3"
          style={{ boxShadow: "0 1px 1px rgba(11,31,23,0.04), 0 12px 32px -12px rgba(11,31,23,0.18)" }}
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-harvest-50 text-harvest-700">
            <BadgeCheck className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">Yield protected</p>
            <p className="font-display text-[15px] font-semibold text-ink">₹2.1L · 2-acre field</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] as const }}
        className="absolute -top-5 -right-3 hidden sm:block"
      >
        <div
          className="flex items-center gap-2.5 rounded-full border border-black/[0.06] bg-white px-3.5 py-2"
          style={{ boxShadow: "0 1px 1px rgba(11,31,23,0.04), 0 12px 32px -12px rgba(11,31,23,0.18)" }}
        >
          <div className="relative flex h-1.5 w-1.5 items-center justify-center">
            <span className="absolute h-1.5 w-1.5 animate-ping rounded-full bg-leaf-500/80" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-leaf-600" />
          </div>
          <span className="text-[11.5px] font-semibold text-ink">Live · MEAF Ensemble</span>
        </div>
      </motion.div>
    </div>
  );
}

function TreatmentPill({
  label, name, note, tone, icon,
}: {
  label: string; name: string; note: string;
  tone: "leaf" | "earth"; icon: React.ReactNode;
}) {
  const styles = tone === "leaf"
    ? { wrap: "border-leaf-100 bg-leaf-50/60", chip: "bg-leaf-100 text-leaf-800", iconWrap: "bg-leaf-100 text-leaf-700" }
    : { wrap: "border-earth-100 bg-earth-50/50", chip: "bg-earth-100 text-earth-800", iconWrap: "bg-earth-100 text-earth-700" };
  return (
    <div className={`rounded-xl border ${styles.wrap} p-3`}>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 rounded-full ${styles.chip} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
          {icon} {label}
        </span>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-tight text-ink">{name}</p>
      <p className="mt-0.5 text-[11.5px] tabular-nums text-ink-muted">{note}</p>
    </div>
  );
}

/* ============================================================ */
/*                          LOGO STRIP                           */
/* ============================================================ */
function LogoStrip() {
  const items = [
    "BMS Institute of Technology",
    "PlantVillage Dataset",
    "MEAF Research",
    "Kisan Call Centre",
    "PMFBY",
  ];
  return (
    <section className="border-t border-black/[0.05] bg-surface-2/60">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Built with research from
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {items.map((it) => (
            <li key={it} className="font-display text-[15px] font-semibold tracking-tight text-ink/55">
              {it}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
