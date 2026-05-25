import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BadgeCheck, Camera, ChevronRight, CheckCircle2,
  Cloud, CloudRain, CloudSun, Droplets, FlaskConical, History, Image as ImageIcon,
  Languages, Leaf, Microscope, Phone, RefreshCw, ShieldCheck, Sparkles,
  Sprout, Sun, Thermometer, TrendingDown, TrendingUp, Volume2, VolumeX, Wind, Zap,
} from "lucide-react";

import { useLang, t, type Lang } from "../i18n";
import {
  predict, getTreatment, getEconomics, getSprayWindow, getSupport,
  type ClassName, type PredictResponse, type RejectResponse, type TreatmentResponse,
  type EconomicsResponse, type SprayWindowResponse, type SupportResponse,
} from "../api/meaf";

/* ---------- types & storage ---------- */
type HistoryEntry = {
  id: string; ts: number; cls: ClassName;
  display_en: string; display_hi: string;
  confidence: number; severity: PredictResponse["severity"]; thumb: string;
};
const HISTORY_KEY = "meaf_history_v1";
const loadHistory = (): HistoryEntry[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
};
const saveHistory = (items: HistoryEntry[]) =>
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/* ============================================================ */
export default function Farmer() {
  const { lang, setLang } = useLang();

  const [, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [rejection, setRejection] = useState<RejectResponse | null>(null);
  const [treatment, setTreatment] = useState<TreatmentResponse | null>(null);
  const [econ, setEcon] = useState<EconomicsResponse | null>(null);
  const [spray, setSpray] = useState<SprayWindowResponse | null>(null);
  const [support, setSupport] = useState<SupportResponse | null>(null);
  const [acres, setAcres] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory());
  const [tab, setTab] = useState<"organic" | "chemical" | "prevention">("organic");
  const [speaking, setSpeaking] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const diagnoseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSprayWindow().then(setSpray).catch(() => {});
    getSupport().then(setSupport).catch(() => {});
  }, []);
  useEffect(() => {
    if (result) getEconomics(result.class, acres).then(setEcon).catch(() => {});
  }, [result, acres]);

  async function handleFile(f: File) {
    setFile(f); setError(null); setResult(null); setRejection(null);
    setTreatment(null); setEcon(null);
    setPreview(URL.createObjectURL(f));
    setLoading(true);
    diagnoseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const r = await predict(f);
      if (r.is_leaf === false) {
        setRejection(r);
        return;
      }
      setResult(r);
      const tr = await getTreatment(r.class); setTreatment(tr);
      const thumb = await makeThumb(f);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(), ts: Date.now(), cls: r.class,
        display_en: r.class_display_en, display_hi: r.class_display_hi,
        confidence: r.confidence, severity: r.severity, thumb,
      };
      const next = [entry, ...history].slice(0, 12);
      setHistory(next); saveHistory(next);
    } catch (e) {
      setError(t("error", lang)); console.error(e);
    } finally { setLoading(false); }
  }

  function reset() {
    setFile(null); setPreview(null); setResult(null); setRejection(null);
    setTreatment(null); setEcon(null); setError(null);
    stopSpeak();
  }
  function speakResult() {
    if (!result) return;
    stopSpeak();
    const text = lang === "hi"
      ? `${result.class_display_hi}। विश्वास ${Math.round(result.confidence * 100)} प्रतिशत। ${result.severity.label_hi}। ${result.severity.action_hi}`
      : `${result.class_display_en}. Confidence ${Math.round(result.confidence * 100)} percent. ${result.severity.label_en}. ${result.severity.action_en}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN"; u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }
  function stopSpeak() { window.speechSynthesis.cancel(); setSpeaking(false); }

  function clearHistory() { setHistory([]); localStorage.removeItem(HISTORY_KEY); }
  const isHealthy = result?.class.endsWith("_Healthy") ?? false;

  return (
    <div className="min-h-screen bg-surface-2">
      <TopNav lang={lang} setLang={setLang} />

      <Hero
        lang={lang}
        onCamera={() => cameraRef.current?.click()}
        onGallery={() => galleryRef.current?.click()}
        hidden={!!result || !!rejection || loading}
      />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
             onChange={e => e.target.files && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
             onChange={e => e.target.files && handleFile(e.target.files[0])} />

      {!result && !rejection && !loading && <HowItWorks lang={lang} />}

      <main ref={diagnoseRef} className="mx-auto max-w-6xl px-4 sm:px-6">
        {loading && <LoadingCard lang={lang} preview={preview} />}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
        )}
        {rejection && !loading && (
          <RejectCard data={rejection} preview={preview} onRetry={reset} lang={lang} />
        )}

        {result && !loading && (
          <section className="animate-slide-up pt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button onClick={reset} className="btn-tonal">
                <Camera className="h-4 w-4" /> {t("newScan", lang)}
              </button>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Zap className="h-3.5 w-3.5 text-leaf-600" />
                {t("inferenceTime", lang)}: <span className="font-semibold text-ink">{result.inference_ms} ms</span>
              </div>
            </div>

            <DiagnosisCard result={result} preview={preview} lang={lang}
                            speaking={speaking} onSpeak={speakResult} onStop={stopSpeak} />

            {!isHealthy && (
              <DiseaseDeepDive result={result} lang={lang} />
            )}

            {!isHealthy && (
              <CurePlanSection lang={lang} />
            )}

            {!isHealthy && treatment && (
              <TreatmentSection treatment={treatment} tab={tab} setTab={setTab} lang={lang} />
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <SprayWindowCard data={spray} lang={lang} />
              {!isHealthy && <EconomicsCard data={econ} acres={acres} setAcres={setAcres} lang={lang} />}
            </div>
          </section>
        )}

        {support && <SupportSection data={support} lang={lang} />}
        <HistorySection history={history} clear={clearHistory} lang={lang} />
      </main>

      <Footer lang={lang} />
    </div>
  );
}

/* ============================================================ */
/*                          TOP NAV                              */
/* ============================================================ */
function TopNav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-leaf-600 to-leaf-800 text-white shadow-card">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold text-ink">{t("appTitle", lang)}</p>
            <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-muted">
              {t("appSubtitle", lang)}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-muted lg:flex">
          <a href="#diagnose" className="hover:text-ink">{t("navDiagnose", lang)}</a>
          <a href="#treatment" className="hover:text-ink">{t("navTreatments", lang)}</a>
          <a href="#advisory" className="hover:text-ink">{t("navAdvisory", lang)}</a>
          <a href="#about" className="hover:text-ink">{t("navAbout", lang)}</a>
        </nav>

        <div className="flex items-center gap-3">
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>
    </header>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border-strong bg-white p-0.5 text-xs font-semibold">
      <Languages className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-ink-muted" />
      <button onClick={() => setLang("en")}
        className={`rounded-full px-3 py-1 transition ${lang === "en" ? "bg-leaf-700 text-white shadow-sm" : "text-ink-muted hover:text-ink"}`}>EN</button>
      <button onClick={() => setLang("hi")}
        className={`rounded-full px-3 py-1 transition ${lang === "hi" ? "bg-leaf-700 text-white shadow-sm" : "text-ink-muted hover:text-ink"}`}>हिं</button>
    </div>
  );
}

/* ============================================================ */
/*                            HERO                               */
/* ============================================================ */
function Hero({ lang, onCamera, onGallery, hidden }: {
  lang: Lang; onCamera: () => void; onGallery: () => void; hidden: boolean;
}) {
  if (hidden) return null;
  const heroLines = t("heroTitle", lang).split("\n");
  return (
    <section className="bg-pattern relative overflow-hidden">
      <div className="absolute -right-32 -top-20 h-[460px] w-[460px] animate-blob rounded-full bg-leaf-200/40 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-[300px] w-[300px] animate-blob rounded-full bg-harvest-100/50 blur-3xl" />
      <div className="absolute right-1/3 top-1/3 h-[220px] w-[220px] rounded-full bg-sky-100/40 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:py-20">
        <div className="relative animate-slide-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-leaf-800 backdrop-blur shadow-card">
            <span className="live-dot" />
            <BadgeCheck className="h-3.5 w-3.5" />
            MEAF AI · 99.17% test accuracy · 5-fold CV verified
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {heroLines.map((line, i) => (
              <span key={i} className="block">
                {i === heroLines.length - 1
                  ? <span className="bg-gradient-to-r from-leaf-700 via-leaf-600 to-harvest-600 bg-clip-text text-transparent">{line}</span>
                  : line}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            {t("heroSub", lang)}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={onCamera} className="btn-primary px-6 py-3 text-base">
              <Camera className="h-5 w-5" /> {t("takePhoto", lang)}
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
            <button onClick={onGallery} className="btn-secondary px-6 py-3 text-base">
              <ImageIcon className="h-5 w-5" /> {t("choosePhoto", lang)}
            </button>
          </div>

          <TrustStrip lang={lang} />
        </div>

        <SampleCard lang={lang} />
      </div>
    </section>
  );
}

function TrustStrip({ lang }: { lang: Lang }) {
  const items = [
    { icon: <BadgeCheck className="h-4 w-4 text-leaf-700" />, label: t("trustAccuracy", lang), value: "99.17%" },
    { icon: <Zap className="h-4 w-4 text-harvest-600" />,     label: t("trustLatency",  lang), value: "~200 ms" },
    { icon: <Languages className="h-4 w-4 text-sky-600" />,   label: t("trustLangs",    lang), value: "EN / हिं" },
    { icon: <ShieldCheck className="h-4 w-4 text-leaf-700" />, label: t("trustFree",    lang), value: "₹0" },
  ];
  return (
    <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-border bg-white/70 px-3 py-2.5 backdrop-blur">
          <div className="flex items-center gap-1.5">{it.icon}
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-ink-muted">{it.label}</p>
          </div>
          <p className="mt-0.5 text-base font-semibold text-ink">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function SampleLeafIllustration() {
  // Realistic diseased tomato leaf SVG with concentric target spots (Early Blight).
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="leafBody" cx="40%" cy="38%" r="80%">
          <stop offset="0%" stopColor="#8bd09f" />
          <stop offset="55%" stopColor="#329a55" />
          <stop offset="100%" stopColor="#1a6336" />
        </radialGradient>
        <radialGradient id="lesion" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8eb" stopOpacity="0.7" />
          <stop offset="35%" stopColor="#b2470b" />
          <stop offset="75%" stopColor="#4a1f06" />
          <stop offset="100%" stopColor="#1a6336" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#faa423" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#faa423" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Leaf body */}
      <path
        d="M100 12 C 158 30, 184 78, 170 132 C 158 174, 118 192, 100 188 C 82 192, 42 174, 30 132 C 16 78, 42 30, 100 12 Z"
        fill="url(#leafBody)"
        stroke="#174f2d"
        strokeWidth="1.5"
      />
      {/* Mid-rib */}
      <path d="M100 14 L100 188" stroke="#0b3b1f" strokeWidth="1.6" opacity="0.55" />
      {/* Veins */}
      {[
        "M100 40 Q 75 50 50 60",
        "M100 40 Q 125 50 150 60",
        "M100 70 Q 70 82 42 96",
        "M100 70 Q 130 82 158 96",
        "M100 105 Q 70 118 46 132",
        "M100 105 Q 130 118 154 132",
        "M100 140 Q 78 152 60 162",
        "M100 140 Q 122 152 140 162",
      ].map((d, i) => (
        <path key={i} d={d} stroke="#0b3b1f" strokeWidth="1" fill="none" opacity="0.45" />
      ))}

      {/* Halo around lesions */}
      <circle cx="72" cy="78" r="22" fill="url(#halo)" />
      <circle cx="132" cy="110" r="20" fill="url(#halo)" />
      <circle cx="92" cy="148" r="18" fill="url(#halo)" />

      {/* Concentric target lesions */}
      {[
        { cx: 72, cy: 78, r: 13 },
        { cx: 132, cy: 110, r: 11 },
        { cx: 92, cy: 148, r: 10 },
        { cx: 60, cy: 124, r: 7 },
        { cx: 142, cy: 70, r: 6 },
      ].map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r={c.r} fill="url(#lesion)" />
          <circle cx={c.cx} cy={c.cy} r={c.r * 0.7} fill="none" stroke="#3b1505" strokeWidth="0.6" opacity="0.7" />
          <circle cx={c.cx} cy={c.cy} r={c.r * 0.45} fill="none" stroke="#3b1505" strokeWidth="0.5" opacity="0.6" />
          <circle cx={c.cx} cy={c.cy} r={c.r * 0.22} fill="#2b0e02" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

function SampleCard({ lang }: { lang: Lang }) {
  const symptoms = [
    t("sampleSymptom1", lang),
    t("sampleSymptom2", lang),
    t("sampleSymptom3", lang),
  ];
  return (
    <div className="relative animate-slide-up">
      {/* Soft glow */}
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-leaf-100/70 via-white to-harvest-50 blur-2xl" />
      <div className="hero-blob absolute -right-12 -top-10 h-48 w-48 animate-blob rounded-full" />

      <div className="card relative overflow-hidden p-5 sm:p-6 shadow-elevated ring-leaf">
        {/* Top strip */}
        <div className="flex items-center justify-between">
          <span className="badge-leaf"><Microscope className="h-3 w-3" /> {t("sampleEyebrow", lang)}</span>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
            <span className="live-dot" /> Live demo
          </span>
        </div>

        {/* Main row: illustration + key facts */}
        <div className="mt-4 grid grid-cols-[128px_1fr] gap-4 sm:grid-cols-[150px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-leaf-50 to-leaf-100 ring-1 ring-leaf-200">
            <SampleLeafIllustration />
            {/* Scan line */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="scan-overlay absolute inset-x-0 h-1/3" />
            </div>
            {/* Corner brackets */}
            <span className="absolute left-1.5 top-1.5 h-3 w-3 border-l-2 border-t-2 border-leaf-700/70" />
            <span className="absolute right-1.5 top-1.5 h-3 w-3 border-r-2 border-t-2 border-leaf-700/70" />
            <span className="absolute bottom-1.5 left-1.5 h-3 w-3 border-b-2 border-l-2 border-leaf-700/70" />
            <span className="absolute bottom-1.5 right-1.5 h-3 w-3 border-b-2 border-r-2 border-leaf-700/70" />
          </div>

          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
              {t("diagnosis", lang)}
            </p>
            <h3 className="mt-0.5 font-display text-xl font-bold leading-tight text-ink sm:text-2xl">
              {t("sampleDisease", lang)}
            </h3>
            <p className="mt-1 text-[11.5px] italic text-ink-muted">
              <FlaskConical className="mr-1 inline h-3 w-3" />
              Alternaria solani · fungus
            </p>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-leaf-100">
                <div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-leaf-500 via-leaf-600 to-leaf-700" />
              </div>
              <span className="text-sm font-bold text-leaf-800">92%</span>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-800">
              <AlertTriangle className="h-3 w-3" /> {t("sampleSeverity", lang)}
            </div>
          </div>
        </div>

        {/* Symptoms detected */}
        <div className="mt-5 rounded-xl border border-leaf-200/70 bg-leaf-50/60 p-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-leaf-800">
            {t("sampleSymptoms", lang)}
          </p>
          <ul className="mt-2 grid gap-1.5">
            {symptoms.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-ink">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-leaf-700" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-2 px-2 py-2">
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-ink-muted">{t("yieldRisk", lang)}</p>
            <p className="mt-0.5 text-xs font-bold text-red-700">−30%</p>
          </div>
          <div className="rounded-lg bg-surface-2 px-2 py-2">
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-ink-muted">{t("spreadSpeed", lang)}</p>
            <p className="mt-0.5 text-xs font-bold text-harvest-700">{t("spreadFast", lang)}</p>
          </div>
          <div className="rounded-lg bg-surface-2 px-2 py-2">
            <p className="text-[9.5px] font-semibold uppercase tracking-wider text-ink-muted">{t("doneIn", lang)}</p>
            <p className="mt-0.5 text-xs font-bold text-leaf-800">{t("estimatedDays", lang)}</p>
          </div>
        </div>

        {/* Treatment chips */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-border pt-3">
          <div className="rounded-lg bg-leaf-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-leaf-700">{t("organic", lang)}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">Neem oil ₹450</p>
          </div>
          <div className="rounded-lg bg-earth-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-earth-700">{t("chemical", lang)}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">Mancozeb ₹600</p>
          </div>
        </div>

        {/* CTA hint */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-harvest-50 px-3 py-2 text-[11.5px] text-harvest-800">
          <Sparkles className="h-3.5 w-3.5" />
          <span><span className="font-semibold">{t("sampleAction", lang)}.</span> {t("scrollToDetails", lang)} ↓</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/*                       HOW IT WORKS                            */
/* ============================================================ */
function HowItWorks({ lang }: { lang: Lang }) {
  const steps = [
    { icon: Camera,      title: t("step1Title", lang), body: t("step1Body", lang), tint: "leaf" },
    { icon: Microscope,  title: t("step2Title", lang), body: t("step2Body", lang), tint: "sky" },
    { icon: Sparkles,    title: t("step3Title", lang), body: t("step3Body", lang), tint: "harvest" },
  ];
  const tintCls: Record<string, string> = {
    leaf:    "bg-leaf-100 text-leaf-700",
    sky:     "bg-sky-100 text-sky-700",
    harvest: "bg-harvest-100 text-harvest-700",
  };
  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="section-eyebrow text-center">{t("howTitle", lang)}</p>
        <h2 className="section-title text-center">
          {lang === "hi" ? "तीन सरल चरण" : "Three simple steps"}
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="group relative rounded-2xl border border-border bg-surface-2 p-6 card-hover">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${tintCls[s.tint]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
                <ChevronRight className="absolute right-4 top-6 h-4 w-4 text-ink-muted/0 transition group-hover:text-ink-muted/60" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/*                       LOADING STATE                           */
/* ============================================================ */
function LoadingCard({ lang, preview }: { lang: Lang; preview: string | null }) {
  const stages = lang === "hi"
    ? ["पत्ती की जाँच", "1621 दृश्य गुण निकाले जा रहे हैं", "एनसेम्बल मॉडल पूर्वानुमान", "गंभीरता तय की जा रही है"]
    : ["Validating leaf", "Extracting 1621 visual features", "Ensemble model inference", "Grading severity"];
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        {preview ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-card ring-leaf">
            <img src={preview} alt="" className="aspect-square w-full object-cover" />
            <div className="scan-overlay pointer-events-none absolute inset-x-0 h-1/3" />
            <span className="absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-white" />
            <span className="absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-white" />
            <span className="absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-white" />
            <span className="absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-white" />
          </div>
        ) : (
          <div className="skeleton aspect-square w-full rounded-2xl" />
        )}
      </div>
      <div className="space-y-4 lg:col-span-2">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-leaf-600" />
            <p className="font-display text-lg text-ink">{t("analyzing", lang)}</p>
          </div>
          <ul className="mt-5 space-y-3">
            {stages.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-leaf-500"
                  style={{ animation: `pulseDot 1.4s ease-out infinite`, animationDelay: `${i * 0.18}s` }}
                />
                <span className="text-sm text-ink">{s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-leaf-500 to-leaf-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/*                    DIAGNOSIS RESULT CARD                      */
/* ============================================================ */
function DiagnosisCard({
  result, preview, lang, speaking, onSpeak, onStop,
}: {
  result: PredictResponse; preview: string | null; lang: Lang;
  speaking: boolean; onSpeak: () => void; onStop: () => void;
}) {
  return (
    <div id="diagnose" className="grid gap-6 lg:grid-cols-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card lg:col-span-1">
        {preview && <img src={preview} alt="leaf" className="aspect-square w-full object-cover" />}
      </div>

      <div className="lg:col-span-2">
        <div className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-eyebrow">{t("diagnosis", lang)}</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                {lang === "hi" && result.class_display_hi ? result.class_display_hi : result.class_display_en}
              </h2>
              {result.pathogen && result.pathogen !== "—" && (
                <p className="mt-1 text-xs italic text-ink-muted">
                  <FlaskConical className="mr-1 inline h-3 w-3" />
                  {t("pathogen", lang)}: {result.pathogen}
                </p>
              )}
            </div>
            <SeverityChip severity={result.severity} lang={lang} />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <ConfidenceMeter conf={result.confidence} lang={lang} />
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{t("recommendedAction", lang)}</p>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-ink">
                {lang === "hi" ? result.severity.action_hi : result.severity.action_en}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-surface-2 p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{t("description", lang)}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">
              {lang === "hi" ? result.description_hi : result.description_en}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={speaking ? onStop : onSpeak}
              className="btn-tonal"
            >
              {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {speaking ? t("stopSpeak", lang) : t("speak", lang)}
            </button>
            <ProbabilityChips probs={result.probabilities} top={result.class} lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceMeter({ conf, lang }: { conf: number; lang: Lang }) {
  const pct = Math.round(conf * 100);
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{t("confidence", lang)}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold text-leaf-800">{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-leaf-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-leaf-500 via-leaf-600 to-leaf-700 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProbabilityChips({ probs, top, lang }: { probs: Record<string, number>; top: string; lang: Lang }) {
  const others = Object.entries(probs).filter(([k]) => k !== top).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-ink-muted">{lang === "hi" ? "अन्य संभावना:" : "Also considered:"}</span>
      {others.map(([k, v]) => (
        <span key={k} className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
          {k.replace(/_/g, " ")} · {Math.round(v * 100)}%
        </span>
      ))}
    </div>
  );
}

function SeverityChip({ severity, lang }: { severity: PredictResponse["severity"]; lang: Lang }) {
  const Icon = severity.level === "none" ? CheckCircle2 : AlertTriangle;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
      style={{ backgroundColor: severity.color }}>
      <Icon className="h-3.5 w-3.5" />
      {lang === "hi" ? severity.label_hi : severity.label_en}
    </div>
  );
}

/* ============================================================ */
/*                    DISEASE DEEP-DIVE                          */
/* ============================================================ */
function DiseaseDeepDive({ result, lang }: { result: PredictResponse; lang: Lang }) {
  const symptoms = symptomsForClass(result.class, lang);
  const spreadReasons = [
    { icon: Droplets, color: "sky", text: t("whyHumidity", lang) },
    { icon: CloudRain, color: "sky", text: t("whyRain", lang) },
    { icon: Sun, color: "harvest", text: t("whyStress", lang) },
  ] as const;

  const urgency = result.severity.level;
  const urgencySteps: Array<{ label: string; tone: "red" | "orange" | "yellow" | "green" }> = [
    { label: lang === "hi" ? "अब" : "Now",         tone: "red" },
    { label: lang === "hi" ? "24 घंटे" : "24 hrs", tone: "red" },
    { label: lang === "hi" ? "3 दिन" : "3 days",   tone: "orange" },
    { label: lang === "hi" ? "1 सप्ताह" : "1 week", tone: "yellow" },
    { label: lang === "hi" ? "स्वस्थ" : "Healthy",  tone: "green" },
  ];
  const activeIdx = urgency === "severe" ? 1 : urgency === "moderate" ? 2 : urgency === "mild" ? 3 : 4;

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-3">
      {/* Symptoms */}
      <div className="card p-5 sm:p-6 card-hover">
        <div className="flex items-center justify-between">
          <p className="section-eyebrow">{t("symptomsDetected", lang)}</p>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
            <Microscope className="h-4 w-4" />
          </div>
        </div>
        <ul className="mt-3 space-y-2.5">
          {symptoms.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl bg-leaf-50/60 p-2.5 text-[13px] leading-snug text-ink">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-leaf-700" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why it spreads */}
      <div className="card p-5 sm:p-6 card-hover">
        <div className="flex items-center justify-between">
          <p className="section-eyebrow">{t("whyItSpreads", lang)}</p>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-700">
            <Wind className="h-4 w-4" />
          </div>
        </div>
        <ul className="mt-3 space-y-2.5">
          {spreadReasons.map(({ icon: Icon, color, text }, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-xl bg-surface-2 p-2.5 text-[13px] leading-snug text-ink">
              <div className={`mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg ${
                color === "sky" ? "bg-sky-100 text-sky-700" : "bg-harvest-100 text-harvest-700"
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Urgency timeline */}
      <div className="card p-5 sm:p-6 card-hover">
        <div className="flex items-center justify-between">
          <p className="section-eyebrow">{t("urgency", lang)}</p>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-harvest-100 text-harvest-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink">
          {lang === "hi" ? result.severity.action_hi : result.severity.action_en}
        </p>

        <div className="mt-5">
          <div className="relative h-1.5 w-full rounded-full bg-surface-3">
            <div
              className={`absolute left-0 top-0 h-1.5 rounded-full ${urgency === "none" ? "bg-leaf-500" : urgency === "severe" ? "bg-red-500" : urgency === "moderate" ? "bg-harvest-500" : "bg-yellow-400"}`}
              style={{ width: `${((urgencySteps.length - activeIdx) / (urgencySteps.length - 1)) * 100}%` }}
            />
          </div>
          <ol className="mt-2.5 grid grid-cols-5 gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-ink-muted">
            {urgencySteps.map((s, i) => (
              <li key={i} className={`text-center leading-tight ${i === activeIdx ? "text-ink" : ""}`}>
                {i === activeIdx && <span className="mb-0.5 mx-auto block h-1.5 w-1.5 rounded-full bg-red-600" />}
                {s.label}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-harvest-50 p-3 text-[12px] leading-snug text-harvest-900">
          <Zap className="h-4 w-4 flex-shrink-0" />
          <span>
            {lang === "hi"
              ? "बिना उपचार 7 दिन में पूरे खेत में फैल सकता है।"
              : "Without treatment this can spread across the field in ~7 days."}
          </span>
        </div>
      </div>
    </section>
  );
}

function symptomsForClass(cls: ClassName, lang: Lang): string[] {
  const en: Record<ClassName, string[]> = {
    Tomato_Early_Blight: [
      "Concentric brown target-shaped rings on lower leaves",
      "Yellow halo around dark lesions",
      "Leaf tissue dies and drops; stems may show dark sunken spots",
      "Fruit can develop leathery sunken patches near the stem",
    ],
    Potato_Early_Blight: [
      "Dark concentric rings on older leaves first",
      "Spreads upward causing premature leaf-drop",
      "Tubers may show dark dry-rot lesions at harvest",
      "Worst in warm (24-29°C) humid weather after flowering",
    ],
    Tomato_Healthy: [
      "Uniform green colour with no dark spots",
      "Intact leaf margins, no curling or wilting",
      "Strong upright stems, normal flowering",
    ],
    Potato_Healthy: [
      "Uniform green leaves with no necrotic spots",
      "Intact margins, no yellowing",
      "Vigorous canopy growth",
    ],
  };
  const hi: Record<ClassName, string[]> = {
    Tomato_Early_Blight: [
      "निचली पत्तियों पर गोलाकार भूरे छल्ले",
      "धब्बों के चारों ओर पीला घेरा",
      "पत्ती सूखकर गिरती है; तनों पर गहरे धब्बे",
      "फल पर तने के पास सूखे धँसे धब्बे",
    ],
    Potato_Early_Blight: [
      "पुरानी पत्तियों पर पहले गहरे छल्ले",
      "ऊपर की ओर फैलता है, पत्तियाँ जल्दी गिरती हैं",
      "कंदों पर सूखे धँसे धब्बे दिख सकते हैं",
      "फूल के बाद गर्म नम मौसम (24-29°C) में सबसे ज़्यादा",
    ],
    Tomato_Healthy: [
      "एक समान हरा रंग, कोई धब्बा नहीं",
      "किनारे साफ़, मुड़ाव या मुरझान नहीं",
      "मज़बूत सीधे तने, सामान्य फूल",
    ],
    Potato_Healthy: [
      "एक समान हरे पत्ते, कोई धब्बा नहीं",
      "किनारे साफ़, कोई पीलापन नहीं",
      "अच्छी वृद्धि",
    ],
  };
  return (lang === "hi" ? hi : en)[cls];
}

/* ============================================================ */
/*                    STEP-BY-STEP CURE PLAN                    */
/* ============================================================ */
function CurePlanSection({ lang }: { lang: Lang }) {
  const steps = [
    { day: "1",    title: t("cureStep1Title", lang), body: t("cureStep1Body", lang) },
    { day: "1",    title: t("cureStep2Title", lang), body: t("cureStep2Body", lang) },
    { day: "2-3",  title: t("cureStep3Title", lang), body: t("cureStep3Body", lang) },
    { day: "10-12",title: t("cureStep4Title", lang), body: t("cureStep4Body", lang) },
    { day: "14+",  title: t("cureStep5Title", lang), body: t("cureStep5Body", lang) },
  ];
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="section-eyebrow">{t("curePlan", lang)}</p>
          <h2 className="section-title">
            {lang === "hi" ? "बीमारी ठीक कैसे करें" : "How to cure this disease"}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{t("curePlanSub", lang)}</p>
        </div>
        <span className="hidden rounded-full bg-leaf-50 px-3 py-1 text-[11px] font-semibold text-leaf-800 sm:inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t("doneIn", lang)} {t("estimatedDays", lang)}
        </span>
      </div>

      <div className="card overflow-hidden">
        <ol className="relative">
          {/* Vertical connector line */}
          <span className="absolute left-[2.05rem] top-6 bottom-6 w-px bg-gradient-to-b from-leaf-300 via-leaf-200 to-transparent sm:left-[2.55rem]" />

          {steps.map((s, i) => (
            <li
              key={i}
              className="relative grid grid-cols-[auto_1fr] gap-4 border-b border-border/70 px-4 py-5 last:border-b-0 sm:px-6 sm:py-6 group hover:bg-leaf-50/40 transition-colors"
            >
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div className="step-num">{i + 1}</div>
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-ink-muted">
                  {t("day", lang)} {s.day}
                </span>
              </div>
              <div className="min-w-0 pt-1">
                <h4 className="font-display text-base font-semibold leading-snug text-ink sm:text-lg">
                  {s.title}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex items-center gap-2 border-t border-border bg-leaf-50/50 px-4 py-3 sm:px-6">
          <ShieldCheck className="h-4 w-4 text-leaf-700" />
          <p className="text-[12.5px] leading-snug text-leaf-900">
            <span className="font-semibold">{t("hint", lang)}:</span>{" "}
            {lang === "hi"
              ? "हमेशा मास्क और दस्ताने पहनें। बच्चों और पशुओं को छिड़काव क्षेत्र से दूर रखें।"
              : "Always wear a mask and gloves. Keep children and livestock away from the sprayed area."}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/*                         TREATMENT                             */
/* ============================================================ */
function TreatmentSection({
  treatment, tab, setTab, lang,
}: {
  treatment: TreatmentResponse;
  tab: "organic" | "chemical" | "prevention";
  setTab: (t: "organic" | "chemical" | "prevention") => void;
  lang: Lang;
}) {
  return (
    <section id="treatment" className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="section-eyebrow">{t("treatment", lang)}</p>
          <h2 className="section-title">
            {lang === "hi" ? "क्या और कब करें?" : "What to do, and when"}
          </h2>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-border bg-surface-2">
          <TabBtn icon={Leaf}      active={tab === "organic"}    onClick={() => setTab("organic")}    label={t("organic", lang)}    count={treatment.organic.length} />
          <TabBtn icon={FlaskConical} active={tab === "chemical"}   onClick={() => setTab("chemical")}   label={t("chemical", lang)}   count={treatment.chemical.length} />
          <TabBtn icon={ShieldCheck}  active={tab === "prevention"} onClick={() => setTab("prevention")} label={t("prevention", lang)} count={treatment.prevention_en.length} />
        </div>

        <div className="p-5 sm:p-7">
          {tab === "organic" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {treatment.organic.map((o, i) => <TreatmentCard key={i} item={o} lang={lang} kind="organic" />)}
            </div>
          )}
          {tab === "chemical" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {treatment.chemical.map((c, i) => <TreatmentCard key={i} item={c} lang={lang} kind="chemical" />)}
            </div>
          )}
          {tab === "prevention" && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {(lang === "hi" ? treatment.prevention_hi : treatment.prevention_en).map((p, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-border bg-surface-2 p-4">
                  <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-leaf-100 text-leaf-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-relaxed text-ink">{p}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function TabBtn({ icon: Icon, active, onClick, label, count }: {
  icon: typeof Leaf; active: boolean; onClick: () => void; label: string; count: number;
}) {
  return (
    <button onClick={onClick} className={`tab ${active ? "tab-active" : ""}`}>
      <span className="flex items-center justify-center gap-1.5">
        <Icon className="h-4 w-4" />
        {label}
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-leaf-100 text-leaf-800" : "bg-surface-3 text-ink-muted"}`}>{count}</span>
      </span>
    </button>
  );
}

function TreatmentCard({ item, lang, kind }: {
  item: import("../api/meaf").TreatmentItem; lang: Lang; kind: "organic" | "chemical";
}) {
  const cls = kind === "organic"
    ? "border-leaf-200 bg-leaf-50/50"
    : "border-earth-200 bg-earth-50/40";
  return (
    <div className={`rounded-2xl border p-5 transition card-hover ${cls}`}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-base font-semibold leading-tight text-ink">
          {lang === "hi" ? item.name_hi : item.name_en}
        </h4>
        {kind === "organic" ? <span className="badge-leaf">{t("organic", lang)}</span> : <span className="badge-earth">{t("chemical", lang)}</span>}
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label={t("dose", lang)} value={item.dose} />
        <Row label={t("frequency", lang)} value={item.frequency} />
        <Row label={t("costPerAcre", lang)} value={INR(item.cost_per_acre_inr)} accent />
        {item.phi_days !== undefined && (
          <Row label={t("phi", lang)} value={`${item.phi_days} ${t("days", lang)}`} />
        )}
      </dl>

      <div className="mt-4 flex gap-2 rounded-lg bg-white/60 p-2.5 text-[12px] leading-relaxed text-ink-muted">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-harvest-600" />
        <span>{lang === "hi" ? item.notes_hi : item.notes_en}</span>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[6rem] text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className={`flex-1 font-medium ${accent ? "text-leaf-800 font-bold" : "text-ink"}`}>{value}</dd>
    </div>
  );
}

/* ============================================================ */
/*                       SPRAY WINDOW                            */
/* ============================================================ */
function SprayWindowCard({ data, lang }: { data: SprayWindowResponse | null; lang: Lang }) {
  return (
    <div id="advisory" className="card p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-eyebrow">{t("sprayWindow", lang)}</p>
          <h3 className="font-display text-xl font-semibold text-ink">
            {lang === "hi" ? "मौसम-आधारित सलाह" : "Weather-aware advisory"}
          </h3>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700">
          <Cloud className="h-5 w-5" />
        </div>
      </div>

      {data && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5 text-sm">
            <BadgeCheck className="h-4 w-4 text-sky-700" />
            <span className="text-ink-muted">{t("bestDayToSpray", lang)}:</span>
            <span className="font-semibold text-sky-800">
              {lang === "hi" ? data.recommended_day_hi : data.recommended_day_en}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {data.forecast.map((d, i) => (
              <div key={i}
                className={`relative rounded-xl border p-3 text-center transition card-hover ${
                  d.spray_ok ? "border-leaf-200 bg-leaf-50/60" : "border-harvest-200 bg-harvest-50/40"
                }`}>
                <div className="mb-1.5 flex items-center justify-center">
                  <WeatherIcon rain={d.rain_chance_pct} wind={d.wind_kmph} />
                </div>
                <p className="font-display text-sm font-semibold text-ink">
                  {lang === "hi" ? d.day_hi : d.day_en}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-ink-muted">
                  {lang === "hi" ? d.reason_hi : d.reason_en}
                </p>
                <div className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px] text-ink-muted">
                  <div className="flex items-center justify-center gap-1"><Droplets className="h-3 w-3" /> {d.rain_chance_pct}% {t("rainChance", lang).toLowerCase()}</div>
                  <div className="flex items-center justify-center gap-1"><Wind className="h-3 w-3" /> {d.wind_kmph} km/h</div>
                  <div className="flex items-center justify-center gap-1"><Thermometer className="h-3 w-3" /> {d.temp_c}°C</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WeatherIcon({ rain, wind }: { rain: number; wind: number }) {
  if (rain >= 40) return <CloudRain className="h-7 w-7 text-sky-600" strokeWidth={1.5} />;
  if (wind >= 15) return <Wind className="h-7 w-7 text-earth-600" strokeWidth={1.5} />;
  if (rain >= 15) return <CloudSun className="h-7 w-7 text-harvest-500" strokeWidth={1.5} />;
  return <Sun className="h-7 w-7 text-harvest-500" strokeWidth={1.5} />;
}

/* ============================================================ */
/*                      ECONOMICS CARD                           */
/* ============================================================ */
function EconomicsCard({
  data, acres, setAcres, lang,
}: {
  data: EconomicsResponse | null; acres: number; setAcres: (n: number) => void; lang: Lang;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="section-eyebrow">{t("economics", lang)}</p>
          <h3 className="font-display text-xl font-semibold text-ink">
            {lang === "hi" ? "लागत बनाम लाभ" : "Save vs spend"}
          </h3>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-harvest-100 text-harvest-700">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm font-medium text-ink-muted">{t("acres", lang)}</label>
        <div className="flex items-center overflow-hidden rounded-lg border border-border-strong">
          <button onClick={() => setAcres(Math.max(0.25, acres - 0.5))} className="px-3 py-1.5 text-ink-muted hover:bg-surface-2">−</button>
          <input type="number" step={0.5} min={0.25} max={50} value={acres}
            onChange={(e) => setAcres(Math.max(0.25, Number(e.target.value) || 1))}
            className="w-16 border-x border-border-strong px-2 py-1.5 text-center text-sm font-semibold focus:outline-none" />
          <button onClick={() => setAcres(acres + 0.5)} className="px-3 py-1.5 text-ink-muted hover:bg-surface-2">+</button>
        </div>
      </div>

      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat icon={TrendingUp} label={t("expectedRevenue", lang)} value={INR(data.expected_revenue_inr)} tone="ok" />
            <Stat icon={TrendingDown} label={t("potentialLoss", lang)} value={INR(data.potential_loss_inr_if_untreated)} tone="bad" />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <SmallStat label={t("organicCost", lang)} value={INR(data.cheapest_organic_treatment_cost_inr)} accent="leaf" />
            <SmallStat label={t("chemicalCost", lang)} value={INR(data.cheapest_chemical_treatment_cost_inr)} accent="earth" />
          </div>

          {data.roi_organic_x !== null && data.roi_organic_x > 0 && (
            <div className="mt-4 rounded-2xl border border-harvest-200 bg-gradient-to-br from-harvest-50 to-harvest-100/70 p-4">
              <p className="section-eyebrow !text-harvest-700">{t("roi", lang)}</p>
              <p className="mt-1 font-display text-xl font-bold leading-tight text-ink">
                {lang === "hi"
                  ? <>हर ₹1 जैविक खर्च पर <span className="text-harvest-700">₹{data.roi_organic_x}</span> की वापसी</>
                  : <>Every ₹1 on organic returns <span className="text-harvest-700">₹{data.roi_organic_x}</span></>}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof TrendingUp; label: string; value: string; tone: "ok" | "bad" }) {
  const wrap = tone === "ok"
    ? "border-leaf-200 bg-leaf-50/50"
    : "border-red-200 bg-red-50/50";
  const iconCls = tone === "ok" ? "bg-leaf-100 text-leaf-700" : "bg-red-100 text-red-700";
  const valueCls = tone === "ok" ? "text-leaf-800" : "text-red-700";
  return (
    <div className={`rounded-xl border p-3 ${wrap}`}>
      <div className="flex items-start justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
        <div className={`grid h-6 w-6 place-items-center rounded-md ${iconCls}`}><Icon className="h-3.5 w-3.5" /></div>
      </div>
      <p className={`mt-1 font-display text-xl font-bold ${valueCls}`}>{value}</p>
    </div>
  );
}
function SmallStat({ label, value, accent }: { label: string; value: string; accent: "leaf" | "earth" }) {
  const cls = accent === "leaf" ? "border-leaf-200 bg-leaf-50/40 text-leaf-900" : "border-earth-200 bg-earth-50/40 text-earth-900";
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-base font-bold">{value}</p>
    </div>
  );
}

/* ============================================================ */
/*                          SUPPORT                              */
/* ============================================================ */
function SupportSection({ data, lang }: { data: SupportResponse; lang: Lang }) {
  return (
    <section id="about" className="mt-12">
      <div className="mb-4">
        <p className="section-eyebrow">{t("support", lang)}</p>
        <h2 className="section-title">
          {lang === "hi" ? "विशेषज्ञ की सहायता और सरकारी योजनाएँ" : "Expert help & government schemes"}
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">{t("helplines", lang)}</h3>
            <Phone className="h-4 w-4 text-leaf-600" />
          </div>
          <ul className="mt-3 space-y-3">
            {data.helplines.map((h, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-2 p-3.5">
                <div>
                  <p className="font-semibold text-ink">{lang === "hi" ? h.name_hi : h.name_en}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{h.hours_en}</p>
                  <p className="text-xs text-ink-muted">{h.languages.slice(0, 3).join(" · ")}</p>
                </div>
                <a href={`tel:${h.number.replace(/-/g, "")}`} className="btn-primary self-center px-3 py-1.5 text-xs">
                  <Phone className="h-3 w-3" /> {h.number}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">{t("schemes", lang)}</h3>
            <BadgeCheck className="h-4 w-4 text-leaf-600" />
          </div>
          <ul className="mt-3 space-y-3">
            {data.schemes.map((s, i) => (
              <li key={i} className="rounded-xl border border-border bg-surface-2 p-3.5">
                <p className="font-semibold text-ink">{lang === "hi" ? s.name_hi : s.name_en}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{lang === "hi" ? s.benefit_hi : s.benefit_en}</p>
                <a href={s.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-leaf-700 hover:underline">
                  {t("learnMore", lang)} <ArrowRight className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/*                         HISTORY                               */
/* ============================================================ */
function HistorySection({ history, clear, lang }: { history: HistoryEntry[]; clear: () => void; lang: Lang }) {
  return (
    <section className="mt-12 pb-12">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="section-eyebrow">{t("history", lang)}</p>
          <h2 className="section-title">
            <History className="mr-2 inline h-6 w-6 text-leaf-600" />
            {lang === "hi" ? "पिछले निदान" : "Your recent scans"}
          </h2>
        </div>
        {history.length > 0 && (
          <button onClick={clear} className="btn-ghost text-xs">{t("clearHistory", lang)}</button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="card grid place-items-center p-10 text-center text-sm text-ink-muted">
          <History className="mb-3 h-7 w-7 text-ink-muted/50" />
          {t("noHistory", lang)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {history.map((h) => (
            <div key={h.id} className="overflow-hidden rounded-xl border border-border bg-white shadow-card card-hover">
              <img src={h.thumb} alt="" className="aspect-square w-full object-cover" />
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold text-ink">
                  {lang === "hi" && h.display_hi ? h.display_hi : h.display_en}
                </p>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-ink-muted">
                  <span>{Math.round(h.confidence * 100)}%</span>
                  <span>{new Date(h.ts).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================ */
/*                          FOOTER                               */
/* ============================================================ */
function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-leaf-700 text-white">
              <Sprout className="h-4 w-4" />
            </div>
            <p className="font-display text-lg font-bold text-ink">{t("appTitle", lang)}</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("appSubtitle", lang)}.</p>
        </div>

        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">{t("footerProduct", lang)}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><a href="#diagnose" className="text-ink hover:text-leaf-700">{t("navDiagnose", lang)}</a></li>
            <li><a href="#treatment" className="text-ink hover:text-leaf-700">{t("navTreatments", lang)}</a></li>
            <li><a href="#advisory" className="text-ink hover:text-leaf-700">{t("navAdvisory", lang)}</a></li>
          </ul>
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">{t("footerResources", lang)}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li><a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="text-ink hover:text-leaf-700">PM-KISAN</a></li>
            <li><a href="https://pmfby.gov.in" target="_blank" rel="noreferrer" className="text-ink hover:text-leaf-700">PMFBY</a></li>
            <li><a href="tel:18001801551" className="text-ink hover:text-leaf-700">Kisan Call Centre</a></li>
          </ul>
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">{t("footerCompany", lang)}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            BMS Institute of Technology<br />and Management, Bengaluru
          </p>
          <p className="mt-2 text-[11px] text-ink-muted">{t("poweredBy", lang)} {t("meafFull", lang)}</p>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-ink-muted sm:px-6">{t("footerCopy", lang)}</p>
      </div>
    </footer>
  );
}

/* ============================================================ */
/*                       REJECT (NOT A LEAF)                     */
/* ============================================================ */
function RejectCard({
  data, preview, onRetry, lang,
}: { data: RejectResponse; preview: string | null; onRetry: () => void; lang: Lang }) {
  const tips = lang === "hi" ? data.tips_hi : data.tips_en;
  return (
    <section className="animate-slide-up pt-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-2xl border border-harvest-200 bg-white shadow-card">
            {preview && (
              <img src={preview} alt="" className="aspect-square w-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-transparent to-harvest-900/30">
              <div className="rounded-full bg-white/90 p-3 shadow-lg backdrop-blur">
                <AlertTriangle className="h-7 w-7 text-harvest-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card border-harvest-200 p-6 sm:p-7">
            <span className="badge-harvest"><AlertTriangle className="h-3 w-3" /> {lang === "hi" ? "अस्वीकृत" : "Not accepted"}</span>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {lang === "hi" ? "यह पत्ती की फोटो नहीं लग रही" : "This doesn't look like a leaf photo"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {lang === "hi" ? data.message_hi : data.message_en}
            </p>

            <div className="mt-5 rounded-xl bg-surface-2 p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
                {lang === "hi" ? "अच्छी फोटो के लिए" : "How to get a good photo"}
              </p>
              <ul className="mt-2 space-y-2 text-sm text-ink">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-leaf-600" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button onClick={onRetry} className="btn-primary">
                <Camera className="h-4 w-4" /> {lang === "hi" ? "नई फोटो लें" : "Try a new photo"}
              </button>
              <details className="text-xs text-ink-muted">
                <summary className="cursor-pointer hover:text-ink">{lang === "hi" ? "तकनीकी विवरण" : "Technical details"}</summary>
                <pre className="mt-2 max-w-md overflow-x-auto rounded-md bg-surface-3 p-3 text-[10.5px]">
                  {JSON.stringify(data.checks, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- thumb ---- */
async function makeThumb(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 200; canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
