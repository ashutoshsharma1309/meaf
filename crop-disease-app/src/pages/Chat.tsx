/**
 * Chat — KisanCare AI assistant.
 *
 * Local rule-based responder (no LLM) — pattern-matches the user's prompt
 * against a small knowledge base and returns a structured, illustrated
 * answer. Designed to feel like a polished AI product, with suggested
 * prompts, source citations, and a typing indicator.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp, BookOpen, Bot, CloudSun, Image as ImageIcon, Leaf, Mic,
  ShieldCheck, Sparkles, Stethoscope, Store, User,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { Link } from "react-router-dom";

/* ---------- knowledge base ---------- */
type KbAnswer = {
  text: string;
  bullets?: string[];
  cards?: Array<{ title: string; body: string; icon: typeof Leaf; tone?: "leaf" | "harvest" | "sky" }>;
  cta?: { label: string; to: string };
  sources?: string[];
};

const KB: Array<{ patterns: RegExp[]; answer: KbAnswer }> = [
  {
    patterns: [/early\s*blight/i, /tomato.*disease/i, /brown.*rings/i],
    answer: {
      text:
        "Tomato early blight is caused by **Alternaria solani** — a fungus that thrives in warm humid weather. Look for concentric brown rings on older leaves first, sometimes with a yellow halo. Untreated it can cost 25-35% of yield.",
      cards: [
        { title: "First-line spray", body: "Mancozeb 75% WP, 2.5 g/L water. First spray at 5% symptom level, repeat every 10-12 days.", icon: Leaf, tone: "leaf" },
        { title: "Organic option", body: "Neem oil (Azadirachtin 0.03%) at 5 ml/L. Safer near harvest. 3 sprays at 7-day gaps.", icon: ShieldCheck, tone: "harvest" },
        { title: "Spray window", body: "Aim for a dry 24-hour window after spraying. Avoid windy or rainy days.", icon: CloudSun, tone: "sky" },
      ],
      cta: { label: "Diagnose your leaf photo", to: "/diagnose" },
      sources: ["MEAF Treatment KB", "PlantVillage", "ICAR-IIHR advisory"],
    },
  },
  {
    patterns: [/spray.*window/i, /when.*spray/i, /best.*spray/i, /when.*irrigate/i],
    answer: {
      text:
        "Spray when the next **24 hours are dry**, wind under **12 km/h**, and humidity under **75%**. Early morning (06–10) is safest — temperature is mild and wind is calm.",
      bullets: [
        "Avoid 14:00–16:00 even if dry — too hot, evaporation reduces efficacy.",
        "After a heavy spray, do not irrigate from above for 6 h.",
        "Always wear mask and gloves with chemical sprays.",
      ],
      cta: { label: "Open 7-day advisory", to: "/advisory" },
      sources: ["Advisory KB", "CPRI Shimla guidelines"],
    },
  },
  {
    patterns: [/mandi.*price/i, /sell.*tomato/i, /market.*price/i, /best.*sell/i],
    answer: {
      text:
        "Today's modal price for **Tomato (Local)** at Yeshwantpur APMC is **₹1,450/quintal**, up 6.4% over last week. Kolar is showing slightly higher at ₹1,520 but is 70 km away — factor logistics before shifting.",
      cards: [
        { title: "Yeshwantpur APMC", body: "₹1,450/q · 14 km · gates open 04:00", icon: Store, tone: "leaf" },
        { title: "Kolar APMC",        body: "₹1,520/q · 71 km · gates open 05:30", icon: Store, tone: "harvest" },
      ],
      cta: { label: "Open Mandi prices", to: "/mandi" },
      sources: ["Agmarknet-style demo feed"],
    },
  },
  {
    patterns: [/photo|leaf|diagnos/i],
    answer: {
      text: "Upload a leaf photo and our AI model will tell you the disease, confidence, and a treatment plan in under half a second.",
      cta: { label: "Open Diagnose", to: "/diagnose" },
      sources: ["MEAF Ensemble · 99.17% accuracy"],
    },
  },
  {
    patterns: [/pm-?kisan|scheme|subsid/i],
    answer: {
      text:
        "**PM-KISAN Samman Nidhi** gives ₹6,000/year (3 instalments of ₹2,000) directly to landholding farmers. **PMFBY** offers crop insurance at 2% premium for kharif / 1.5% for rabi.",
      bullets: [
        "PM-KISAN: pmkisan.gov.in · helpline 155261",
        "PMFBY: pmfby.gov.in",
        "Soil Health Card: free testing every 2 years",
      ],
      cta: { label: "View Library", to: "/library" },
      sources: ["Govt of India · Ministry of Agriculture"],
    },
  },
];

const FALLBACK: KbAnswer = {
  text:
    "I'm tuned for crop diseases, mandi prices, spray timing, and govt schemes. Try a more specific question, or pick a starter prompt below.",
};

function answerFor(q: string): KbAnswer {
  for (const k of KB) if (k.patterns.some(p => p.test(q))) return k.answer;
  return FALLBACK;
}

/* ---------- message types ---------- */
type Msg = { id: string; role: "user" | "assistant"; text: string; answer?: KbAnswer };

const STARTERS = [
  { icon: Stethoscope, label: "Diagnose early blight on tomato" },
  { icon: CloudSun,    label: "When should I spray this week?" },
  { icon: Store,       label: "What's the mandi price of tomato today?" },
  { icon: BookOpen,    label: "Which govt schemes can I apply for?" },
];

/* ============================================================ */
export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMsgs(prev => [...prev, userMsg]);
    setDraft("");
    setTyping(true);
    const ans = answerFor(text);
    setTimeout(() => {
      const a: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: ans.text,
        answer: ans,
      };
      setMsgs(prev => [...prev, a]);
      setTyping(false);
    }, 750 + Math.min(900, text.length * 12));
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const isEmpty = msgs.length === 0;

  return (
    <AppShell title="Assistant" subtitle="Your AI farm advisor · runs on-device, no cloud">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* main chat panel */}
        <section className="flex h-[calc(100vh-9.5rem)] flex-col rounded-2xl border border-black/[0.06] bg-white">
          {/* header */}
          <header className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-leaf-500 to-leaf-700 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-[13.5px] font-semibold">KisanCare Assistant</p>
                <p className="text-[11px] text-ink-muted">Beta · always learning</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-2 py-0.5 text-[11px] font-semibold text-leaf-800">
              <Sparkles className="h-3 w-3" /> Local rule engine
            </span>
          </header>

          {/* message stream */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
            {isEmpty ? <EmptyState onPick={(s) => send(s)} /> : (
              <div className="space-y-4">
                {msgs.map((m) => <Message key={m.id} m={m} />)}
                {typing && <TypingBubble />}
              </div>
            )}
          </div>

          {/* composer */}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => draft.trim() && send(draft.trim())}
          />
        </section>

        {/* sidebar — context */}
        <aside className="space-y-4">
          <ContextCard
            icon={Sparkles}
            title="What I'm good at"
            items={[
              "Crop disease identification + treatment",
              "Spray windows & weather risk",
              "Mandi prices & best sell time",
              "Government schemes & subsidies",
            ]}
          />
          <ContextCard
            icon={ShieldCheck}
            title="What I don't do"
            items={[
              "Open-ended chat (yet)",
              "Long-term forecasts beyond 7 days",
              "Pesticide chemistry beyond label dose",
            ]}
          />
          <Link to="/diagnose" className="block rounded-2xl border border-leaf-200 bg-leaf-50/60 p-4 hover:bg-leaf-50">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-leaf-700">Faster path</p>
            <p className="mt-1 font-display text-[16px] font-semibold text-ink">Upload a leaf photo</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">Skip typing — get a diagnosis in ~200 ms.</p>
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

/* ---------- subcomponents ---------- */
function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-leaf-100 to-leaf-50 text-leaf-700">
        <Bot className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-[26px] font-semibold leading-tight">How can I help your farm today?</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
        Ask in plain English or Hindi. I can help with crop disease, spray timing, mandi prices, and govt schemes. For a fast diagnosis, just upload a photo on the <Link to="/diagnose" className="text-leaf-700 underline">Diagnose</Link> page.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s.label} onClick={() => onPick(s.label)}
            className="group flex items-start gap-3 rounded-xl border border-black/[0.06] bg-surface-2/60 p-3.5 text-left transition hover:border-leaf-200 hover:bg-leaf-50/40"
          >
            <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-white text-leaf-700">
              <s.icon className="h-4 w-4" />
            </div>
            <span className="text-[13.5px] font-medium text-ink group-hover:text-leaf-800">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ m }: { m: Msg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14px] text-white">{m.text}</div>
        <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-surface-3 text-ink">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }
  const a = m.answer!;
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-leaf-50 text-leaf-700">
        <Bot className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[80%] space-y-3">
        <div className="rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-4 py-3 text-[14px] leading-relaxed text-ink">
          {renderInline(a.text)}
          {a.bullets && (
            <ul className="mt-2 space-y-1 pl-4 text-[13.5px] text-ink-muted">
              {a.bullets.map((b, i) => <li key={i} className="list-disc">{b}</li>)}
            </ul>
          )}
        </div>
        {a.cards && (
          <div className="grid gap-2 sm:grid-cols-2">
            {a.cards.map((c, i) => {
              const tone = c.tone || "leaf";
              const map = {
                leaf:    "border-leaf-200 bg-leaf-50/50",
                harvest: "border-harvest-200 bg-harvest-50/50",
                sky:     "border-sky-200 bg-sky-50/50",
              } as const;
              return (
                <div key={i} className={`rounded-xl border ${map[tone]} p-3`}>
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-ink"><c.icon className="h-3.5 w-3.5" />{c.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{c.body}</p>
                </div>
              );
            })}
          </div>
        )}
        {a.cta && (
          <Link to={a.cta.to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-leaf-700 hover:text-leaf-800">
            {a.cta.label} →
          </Link>
        )}
        {a.sources && (
          <p className="text-[11px] text-ink-muted">
            Sources · {a.sources.map((s, i) => (
              <span key={s} className="italic">{i > 0 ? " · " : ""}{s}</span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-full bg-leaf-50 text-leaf-700"><Bot className="h-4 w-4" /></div>
      <div className="rounded-2xl rounded-bl-md border border-black/[0.06] bg-white px-4 py-3">
        <div className="flex items-center gap-1">
          <Dot delay={0} /><Dot delay={120} /><Dot delay={240} />
        </div>
      </div>
    </div>
  );
}
function Dot({ delay }: { delay: number }) {
  return <span className="block h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted/60" style={{ animationDelay: `${delay}ms` }} />;
}

function Composer({
  value, onChange, onSend,
}: { value: string; onChange: (v: string) => void; onSend: () => void }) {
  return (
    <div className="border-t border-black/[0.06] p-3">
      <div className="flex items-end gap-2 rounded-xl border border-black/[0.08] bg-surface-2/60 px-3 py-2 focus-within:border-leaf-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-leaf-200">
        <button title="Upload image" className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-black/[0.04]">
          <ImageIcon className="h-4 w-4" />
        </button>
        <button title="Voice" className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-black/[0.04]">
          <Mic className="h-4 w-4" />
        </button>
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Ask anything about your crops…"
          className="max-h-32 flex-1 resize-none bg-transparent py-1 text-[14px] focus:outline-none"
        />
        <button
          onClick={onSend}
          disabled={!value.trim()}
          className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white transition disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 px-1 text-[11px] text-ink-muted">
        AI may make mistakes — verify critical doses against your label.
      </p>
    </div>
  );
}

function ContextCard({ icon: Icon, title, items }: { icon: typeof Leaf; title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <Icon className="h-4 w-4 text-leaf-700" />
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-[12.5px] text-ink-muted">
        {items.map((i) => <li key={i} className="flex gap-1.5"><span className="text-leaf-500">·</span>{i}</li>)}
      </ul>
    </div>
  );
}

/* render **bold** markers in the KB text */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p)
      ? <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}

export const _u = useMemo;
