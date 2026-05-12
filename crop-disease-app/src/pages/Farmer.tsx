import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle, Camera, CheckCircle2, Cloud, Droplets, History, Image as ImageIcon,
  Leaf, Phone, RefreshCw, Sparkles, Thermometer, TrendingUp, Volume2, VolumeX, Wind,
} from "lucide-react";

import { useLang, t, type Lang } from "../i18n";
import {
  predict, getTreatment, getEconomics, getSprayWindow, getSupport,
  type ClassName, type PredictResponse, type TreatmentResponse,
  type EconomicsResponse, type SprayWindowResponse, type SupportResponse,
} from "../api/meaf";

type HistoryEntry = {
  id: string;
  ts: number;
  cls: ClassName;
  display_en: string;
  display_hi: string;
  confidence: number;
  severity: PredictResponse["severity"];
  thumb: string;
};

const HISTORY_KEY = "meaf_history_v1";

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}

function saveHistory(items: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 10)));
}

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function Farmer() {
  const { lang, setLang } = useLang();

  // diagnosis state
  const [, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [treatment, setTreatment] = useState<TreatmentResponse | null>(null);
  const [econ, setEcon] = useState<EconomicsResponse | null>(null);
  const [spray, setSpray] = useState<SprayWindowResponse | null>(null);
  const [support, setSupport] = useState<SupportResponse | null>(null);
  const [acres, setAcres] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory());
  const [tab, setTab] = useState<"organic" | "chemical" | "prevention">("organic");
  const [speaking, setSpeaking] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // background loads
  useEffect(() => {
    getSprayWindow().then(setSpray).catch(() => {});
    getSupport().then(setSupport).catch(() => {});
  }, []);

  // recompute economics on acres change
  useEffect(() => {
    if (result) getEconomics(result.class, acres).then(setEcon).catch(() => {});
  }, [result, acres]);

  async function handleFile(f: File) {
    setFile(f);
    setError(null);
    setResult(null);
    setTreatment(null);
    setEcon(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    setLoading(true);
    try {
      const r = await predict(f);
      setResult(r);
      const tr = await getTreatment(r.class);
      setTreatment(tr);
      // add to history (downsized thumb via canvas)
      const thumb = await makeThumb(f);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        ts: Date.now(),
        cls: r.class,
        display_en: r.class_display_en,
        display_hi: r.class_display_hi,
        confidence: r.confidence,
        severity: r.severity,
        thumb,
      };
      const next = [entry, ...history].slice(0, 10);
      setHistory(next);
      saveHistory(next);
    } catch (e: unknown) {
      setError(t("error", lang));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setTreatment(null);
    setEcon(null);
    setError(null);
    stopSpeak();
  }

  function speakResult() {
    if (!result) return;
    stopSpeak();
    const text =
      lang === "hi"
        ? `${result.class_display_hi}। विश्वास ${Math.round(result.confidence * 100)} प्रतिशत। ${result.severity.label_hi}। ${result.severity.action_hi}`
        : `${result.class_display_en}. Confidence ${Math.round(result.confidence * 100)} percent. ${result.severity.label_en}. ${result.severity.action_en}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }
  function stopSpeak() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  const isHealthy = result?.class.endsWith("_Healthy") ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-emerald-900">{t("appTitle", lang)}</p>
              <p className="text-[11px] uppercase tracking-wider text-emerald-700/70">{t("appSubtitle", lang)}</p>
            </div>
          </div>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* HERO + UPLOAD */}
        {!result && (
          <section className="grid gap-6 sm:grid-cols-2 sm:gap-10 sm:py-6">
            <div className="flex flex-col justify-center">
              <h1 className="font-display text-3xl font-bold leading-tight text-emerald-950 sm:text-4xl">
                {lang === "hi"
                  ? "एक फोटो खींचो — रोग पहचानो, इलाज पाओ।"
                  : "One photo. Disease detected. Treatment in hand."}
              </h1>
              <p className="mt-3 text-base text-slate-600">
                {lang === "hi"
                  ? "MEAF AI मॉडल पत्ती की फोटो से 99% सटीकता के साथ रोग पहचानता है। फिर हम जैविक/रासायनिक उपचार, लागत और छिड़काव का सबसे अच्छा दिन सुझाते हैं।"
                  : "Our MEAF AI model identifies leaf disease from one photo with 99% accuracy, then suggests organic/chemical treatment, costs, and the best day to spray."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => e.target.files && handleFile(e.target.files[0])}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files && handleFile(e.target.files[0])}
                />
                <button
                  className="btn-primary inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700"
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera className="h-4 w-4" /> {t("takePhoto", lang)}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-5 py-3 text-emerald-800 hover:bg-emerald-50"
                  onClick={() => galleryRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" /> {t("choosePhoto", lang)}
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                {lang === "hi"
                  ? "समर्थित: आलू / टमाटर — स्वस्थ या अगेती झुलसा"
                  : "Supported: potato / tomato — healthy or early blight"}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
              <div className="aspect-square w-full bg-gradient-to-br from-emerald-100 via-white to-emerald-50 p-6">
                <div className="grid h-full grid-cols-2 gap-3">
                  {["🥔", "🍅", "🌿", "📱"].map((emoji, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center rounded-xl bg-white text-6xl shadow-sm"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-emerald-100 bg-white p-6 shadow-sm">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            <p className="text-sm text-emerald-900">{t("analyzing", lang)}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
        )}

        {/* RESULT */}
        {result && !loading && (
          <>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
              >
                <Camera className="h-4 w-4" /> {t("newScan", lang)}
              </button>
              <div className="text-xs text-slate-400">
                {t("inferenceTime", lang)}: {result.inference_ms} ms
              </div>
            </div>

            {/* DIAGNOSIS CARD */}
            <section className="mt-4 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                  {preview && (
                    <img src={preview} alt="leaf" className="aspect-square w-full object-cover" />
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-emerald-700/70">{t("diagnosis", lang)}</p>
                      <h2 className="mt-1 font-display text-2xl font-bold text-emerald-950 sm:text-3xl">
                        {lang === "hi" && result.class_display_hi ? result.class_display_hi : result.class_display_en}
                      </h2>
                      {result.pathogen !== "—" && result.pathogen && (
                        <p className="mt-1 text-xs italic text-slate-500">
                          {t("pathogen", lang)}: {result.pathogen}
                        </p>
                      )}
                    </div>
                    <SeverityChip severity={result.severity} lang={lang} />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{t("confidence", lang)}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="text-3xl font-bold text-emerald-700">
                          {Math.round(result.confidence * 100)}%
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-emerald-100">
                            <div
                              className="h-2 rounded-full bg-emerald-600"
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{t("recommendedAction", lang)}</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {lang === "hi" ? result.severity.action_hi : result.severity.action_en}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">{t("description", lang)}: </span>
                    {lang === "hi" ? result.description_hi : result.description_en}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      onClick={speaking ? stopSpeak : speakResult}
                      className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                    >
                      {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {speaking ? t("stopSpeak", lang) : t("speak", lang)}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* TREATMENT */}
            {!isHealthy && treatment && (
              <section className="mt-8">
                <h3 className="mb-3 font-display text-xl font-bold text-emerald-950">
                  <Sparkles className="mr-1 inline h-5 w-5 text-emerald-600" /> {t("treatment", lang)}
                </h3>
                <div className="rounded-2xl border border-emerald-100 bg-white p-1 shadow-sm">
                  <div className="flex border-b border-emerald-100">
                    <TabBtn active={tab === "organic"} onClick={() => setTab("organic")} label={t("organic", lang)} count={treatment.organic.length} />
                    <TabBtn active={tab === "chemical"} onClick={() => setTab("chemical")} label={t("chemical", lang)} count={treatment.chemical.length} />
                    <TabBtn active={tab === "prevention"} onClick={() => setTab("prevention")} label={t("prevention", lang)} count={treatment.prevention_en.length} />
                  </div>
                  <div className="p-4 sm:p-6">
                    {tab === "organic" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {treatment.organic.map((o, i) => (
                          <TreatmentCard key={i} item={o} lang={lang} kind="organic" />
                        ))}
                      </div>
                    )}
                    {tab === "chemical" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {treatment.chemical.map((c, i) => (
                          <TreatmentCard key={i} item={c} lang={lang} kind="chemical" />
                        ))}
                      </div>
                    )}
                    {tab === "prevention" && (
                      <ul className="space-y-2 text-sm text-slate-800">
                        {(lang === "hi" ? treatment.prevention_hi : treatment.prevention_en).map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" /> {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SPRAY-WINDOW + ECONOMICS */}
            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <SprayWindowCard data={spray} lang={lang} />
              {!isHealthy && (
                <EconomicsCard data={econ} acres={acres} setAcres={setAcres} lang={lang} />
              )}
            </section>
          </>
        )}

        {/* SUPPORT */}
        {support && <SupportSection data={support} lang={lang} />}

        {/* HISTORY */}
        <HistorySection history={history} clear={clearHistory} lang={lang} />

        <footer className="mt-12 border-t border-emerald-100 pt-6 text-center text-xs text-slate-500">
          <p>
            {lang === "hi"
              ? "MEAF (मल्टीमॉडल एज-AI फ्रेमवर्क) · 99.17% सटीकता · CPU पर रन"
              : "MEAF (Multimodal Edge-AI Framework) · 99.17% test accuracy · runs on CPU"}
          </p>
        </footer>
      </main>
    </div>
  );
}

/* -------- small subcomponents -------- */

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex overflow-hidden rounded-full border border-emerald-200 bg-white text-sm font-medium">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 ${lang === "en" ? "bg-emerald-600 text-white" : "text-emerald-800"}`}
      >EN</button>
      <button
        onClick={() => setLang("hi")}
        className={`px-3 py-1 ${lang === "hi" ? "bg-emerald-600 text-white" : "text-emerald-800"}`}
      >हिंदी</button>
    </div>
  );
}

function SeverityChip({ severity, lang }: { severity: PredictResponse["severity"]; lang: Lang }) {
  const icons = {
    none: <CheckCircle2 className="h-4 w-4" />,
    mild: <AlertTriangle className="h-4 w-4" />,
    moderate: <AlertTriangle className="h-4 w-4" />,
    severe: <AlertTriangle className="h-4 w-4" />,
  } as const;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: severity.color }}
    >
      {icons[severity.level]}
      {lang === "hi" ? severity.label_hi : severity.label_en}
    </div>
  );
}

function TabBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-sm font-medium ${active ? "border-b-2 border-emerald-600 text-emerald-800" : "text-slate-500 hover:text-slate-800"}`}
    >
      {label} <span className="ml-1 text-xs opacity-70">({count})</span>
    </button>
  );
}

function TreatmentCard({ item, lang, kind }: { item: import("../api/meaf").TreatmentItem; lang: Lang; kind: "organic" | "chemical" }) {
  const bg = kind === "organic" ? "border-emerald-100 bg-emerald-50/40" : "border-amber-100 bg-amber-50/30";
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <h4 className="font-semibold text-slate-900">{lang === "hi" ? item.name_hi : item.name_en}</h4>
      <dl className="mt-2 space-y-1 text-sm text-slate-700">
        <Row label={t("dose", lang)} value={item.dose} />
        <Row label={t("frequency", lang)} value={item.frequency} />
        <Row label={t("costPerAcre", lang)} value={INR(item.cost_per_acre_inr)} />
        {item.phi_days !== undefined && (
          <Row label={t("phi", lang)} value={`${item.phi_days} ${t("days", lang)}`} />
        )}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        ⚠ {lang === "hi" ? item.notes_hi : item.notes_en}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[5.5rem] text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function SprayWindowCard({ data, lang }: { data: SprayWindowResponse | null; lang: Lang }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-emerald-950">
        <Cloud className="h-5 w-5 text-emerald-600" /> {t("sprayWindow", lang)}
      </h3>
      {!data ? (
        <p className="mt-2 text-sm text-slate-500">…</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-emerald-800">{t("bestDayToSpray", lang)}:</span>{" "}
            {lang === "hi" ? data.recommended_day_hi : data.recommended_day_en}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {data.forecast.map((d, i) => (
              <div
                key={i}
                className={`rounded-xl border p-3 text-center ${d.spray_ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50/40"}`}
              >
                <p className="text-xs font-semibold text-slate-700">{lang === "hi" ? d.day_hi : d.day_en}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{lang === "hi" ? d.reason_hi : d.reason_en}</p>
                <div className="mt-2 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center justify-center gap-1"><Droplets className="h-3 w-3" /> {d.rain_chance_pct}%</div>
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

function EconomicsCard({
  data, acres, setAcres, lang,
}: { data: EconomicsResponse | null; acres: number; setAcres: (n: number) => void; lang: Lang }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-emerald-950">
        <TrendingUp className="h-5 w-5 text-emerald-600" /> {t("economics", lang)}
      </h3>
      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm text-slate-700">{t("acres", lang)}</label>
        <input
          type="number"
          step={0.5}
          min={0.25}
          max={50}
          value={acres}
          onChange={(e) => setAcres(Math.max(0.25, Number(e.target.value) || 1))}
          className="w-24 rounded-md border border-emerald-200 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      {data && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Stat label={t("expectedRevenue", lang)} value={INR(data.expected_revenue_inr)} tone="ok" />
          <Stat label={t("potentialLoss", lang)} value={INR(data.potential_loss_inr_if_untreated)} tone="bad" />
          <Stat label={t("organicCost", lang)} value={INR(data.cheapest_organic_treatment_cost_inr)} tone="muted" />
          <Stat label={t("chemicalCost", lang)} value={INR(data.cheapest_chemical_treatment_cost_inr)} tone="muted" />
          {data.roi_organic_x !== null && (
            <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="text-xs uppercase tracking-wider text-emerald-700">{t("roi", lang)}</p>
              <p className="mt-1 font-semibold text-emerald-900">
                {lang === "hi"
                  ? `जैविक: ₹${data.roi_organic_x} वापसी प्रति ₹1 खर्च`
                  : `Organic: ₹${data.roi_organic_x} returned for every ₹1 spent`}
              </p>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "bad" | "muted" }) {
  const cls = {
    ok: "border-emerald-100 bg-emerald-50/70 text-emerald-900",
    bad: "border-red-100 bg-red-50/70 text-red-900",
    muted: "border-slate-100 bg-slate-50 text-slate-800",
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function SupportSection({ data, lang }: { data: SupportResponse; lang: Lang }) {
  return (
    <section className="mt-10">
      <h3 className="mb-3 font-display text-xl font-bold text-emerald-950">
        <Phone className="mr-1 inline h-5 w-5 text-emerald-600" /> {t("support", lang)}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800">{t("helplines", lang)}</h4>
          <ul className="mt-3 space-y-3">
            {data.helplines.map((h, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-emerald-50/50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{lang === "hi" ? h.name_hi : h.name_en}</p>
                  <p className="text-xs text-slate-500">{h.hours_en}</p>
                  <p className="text-xs text-slate-500">{h.languages.slice(0, 3).join(" · ")}</p>
                </div>
                <a
                  href={`tel:${h.number.replace(/-/g, "")}`}
                  className="inline-flex items-center gap-1 self-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Phone className="h-3 w-3" /> {h.number}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-800">{t("schemes", lang)}</h4>
          <ul className="mt-3 space-y-3">
            {data.schemes.map((s, i) => (
              <li key={i} className="rounded-xl bg-emerald-50/50 p-3">
                <p className="font-semibold text-slate-900">{lang === "hi" ? s.name_hi : s.name_en}</p>
                <p className="mt-1 text-xs text-slate-700">{lang === "hi" ? s.benefit_hi : s.benefit_en}</p>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-emerald-700 hover:underline"
                >
                  {t("learnMore", lang)} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function HistorySection({ history, clear, lang }: { history: HistoryEntry[]; clear: () => void; lang: Lang }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-emerald-950">
          <History className="mr-1 inline h-5 w-5 text-emerald-600" /> {t("history", lang)}
        </h3>
        {history.length > 0 && (
          <button onClick={clear} className="text-xs font-medium text-slate-500 hover:text-red-600">{t("clearHistory", lang)}</button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          {t("noHistory", lang)}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {history.map((h) => (
            <div key={h.id} className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
              <img src={h.thumb} alt="" className="aspect-square w-full object-cover" />
              <div className="p-2">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {lang === "hi" && h.display_hi ? h.display_hi : h.display_en}
                </p>
                <p className="text-[10px] text-slate-500">
                  {Math.round(h.confidence * 100)}% · {new Date(h.ts).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---- helpers ---- */
async function makeThumb(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 160;
        canvas.width = SIZE; canvas.height = SIZE;
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
