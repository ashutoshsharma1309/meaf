/**
 * Library — searchable knowledge base of diseases, pests, crops, practices.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, Bug, Filter, Leaf, Search,
  ShieldCheck, Sprout,
} from "lucide-react";
import AppShell, { SectionHeader } from "../components/AppShell";
import { ARTICLES, CAT_TINT, type Article, type Category } from "../data/articles";

const CATS: Array<{ id: Category | "All"; icon: typeof Leaf; }> = [
  { id: "All",      icon: Filter },
  { id: "Disease",  icon: Bug },
  { id: "Pest",     icon: ShieldCheck },
  { id: "Crop",     icon: Sprout },
  { id: "Practice", icon: BookOpen },
  { id: "Scheme",   icon: Leaf },
];

/* ============================================================ */
export default function Library() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    return ARTICLES.filter(a => {
      if (cat !== "All" && a.category !== cat) return false;
      if (q) {
        const t = q.toLowerCase();
        return (
          a.title.toLowerCase().includes(t) ||
          a.excerpt.toLowerCase().includes(t) ||
          a.tags.some(tag => tag.toLowerCase().includes(t))
        );
      }
      return true;
    });
  }, [q, cat]);

  const popular = ARTICLES.filter(a => a.popular).slice(0, 4);

  return (
    <AppShell title="Knowledge Library" subtitle="Diseases, pests, crops, practices, and schemes — all in one place">
      {/* search hero */}
      <section className="rounded-2xl border border-black/[0.06] bg-gradient-to-br from-leaf-50/60 via-white to-sky-50/60 p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-leaf-700">Library</p>
        <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">
          Look up anything that grows, eats your crop, or pays you.
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          {ARTICLES.length} curated articles · cross-referenced with the diagnose model · all sources cited.
        </p>
        <div className="mt-5 max-w-2xl">
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 focus-within:border-leaf-500 focus-within:ring-2 focus-within:ring-leaf-200">
            <Search className="h-4 w-4 text-ink-muted" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Try: tomato blight, fall armyworm, PMFBY, drip irrigation…"
              className="flex-1 bg-transparent text-[14px] focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} className="text-[12px] font-semibold text-ink-muted hover:text-ink">Clear</button>
            )}
          </div>
        </div>
      </section>

      {/* category chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATS.map((c) => {
          const active = cat === c.id;
          return (
            <button
              key={c.id} onClick={() => setCat(c.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                active ? "border-ink bg-ink text-white" : "border-black/[0.08] bg-white text-ink-muted hover:border-black/[0.18] hover:text-ink"
              }`}
            >
              <c.icon className="h-3.5 w-3.5" /> {c.id}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15" : "bg-black/[0.06] text-ink"}`}>
                {c.id === "All" ? ARTICLES.length : ARTICLES.filter(a => a.category === c.id).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* popular row (only when no filter) */}
      {!q && cat === "All" && (
        <section className="mt-8">
          <SectionHeader title="Popular this week" sub="Most-read articles by farmers near you" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((a) => <PopularCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}

      {/* all results */}
      <section className="mt-8">
        <SectionHeader
          title={q ? `Results for "${q}"` : cat === "All" ? "All articles" : `${cat} articles`}
          sub={`${filtered.length} ${filtered.length === 1 ? "result" : "results"}`}
        />
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/[0.10] bg-white p-12 text-center">
            <Search className="mx-auto h-6 w-6 text-ink-muted/60" />
            <p className="mt-3 text-[14px] font-semibold text-ink">No results</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">Try a different keyword or pick another category.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => <ArticleRow key={a.slug} a={a} />)}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

/* ---------- cards ---------- */
function PopularCard({ a }: { a: Article }) {
  return (
    <Link to={`/library/${a.slug}`} className="group block overflow-hidden rounded-2xl border border-black/[0.06] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(11,31,23,0.18)]">
      <div className="relative h-28 overflow-hidden">
        <ArticleHero category={a.category} title={a.title} />
      </div>
      <div className="p-4">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CAT_TINT[a.category]}`}>
          {a.category}
        </span>
        <h3 className="mt-2 font-display text-[15px] font-semibold leading-tight">{a.title}</h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-muted">{a.excerpt}</p>
        <p className="mt-3 text-[11px] text-ink-muted">{a.reading_min} min read</p>
      </div>
    </Link>
  );
}

function ArticleRow({ a }: { a: Article }) {
  return (
    <li>
      <Link to={`/library/${a.slug}`} className="group flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-4 transition hover:-translate-y-0.5 hover:border-leaf-200 hover:shadow-[0_10px_24px_-12px_rgba(11,31,23,0.16)]">
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CAT_TINT[a.category]}`}>
            {a.category}
          </span>
          <span className="text-[11px] text-ink-muted">{a.reading_min} min</span>
        </div>
        <h3 className="mt-3 font-display text-[15.5px] font-semibold leading-tight">{a.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-ink-muted">{a.excerpt}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {a.tags.slice(0, 3).map(t => (
            <span key={t} className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[10.5px] text-ink-muted">{t}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-black/[0.05] pt-3">
          <span className="text-[12px] font-semibold text-leaf-700 group-hover:text-leaf-800">Read article</span>
          <ArrowRight className="h-3.5 w-3.5 text-leaf-700 transition group-hover:translate-x-0.5" />
        </div>
      </Link>
    </li>
  );
}

/* abstract SVG art for each article header — no external images */
function ArticleHero({ category, title }: { category: Category; title: string }) {
  const seed = [...title].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hueA = (seed * 37) % 360;
  const hueB = (hueA + 40) % 360;
  return (
    <svg viewBox="0 0 320 120" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${seed}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%"  stopColor={`hsl(${hueA}, 50%, 92%)`} />
          <stop offset="100%" stopColor={`hsl(${hueB}, 55%, 88%)`} />
        </linearGradient>
      </defs>
      <rect width="320" height="120" fill={`url(#g-${seed})`} />
      {/* abstract shapes vary by category */}
      {category === "Disease" && (
        <>
          <circle cx="60"  cy="60" r="34" fill="#fff" opacity="0.6" />
          <circle cx="60"  cy="60" r="22" fill="#fff" opacity="0.6" />
          <circle cx="60"  cy="60" r="10" fill="#fff" opacity="0.8" />
          <circle cx="220" cy="40" r="14" fill="#fff" opacity="0.45" />
          <circle cx="270" cy="80" r="20" fill="#fff" opacity="0.45" />
        </>
      )}
      {category === "Pest" && (
        <>
          <path d="M 40 80 Q 160 20 280 80" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" />
          <circle cx="120" cy="55" r="8" fill="#fff" opacity="0.85" />
          <circle cx="200" cy="55" r="8" fill="#fff" opacity="0.85" />
        </>
      )}
      {category === "Crop" && (
        <>
          <path d="M 80 110 C 80 60 110 50 130 70 C 150 50 180 60 180 110 Z" fill="#fff" opacity="0.7" />
          <line x1="130" y1="70" x2="130" y2="110" stroke="#fff" strokeWidth="2" opacity="0.7" />
        </>
      )}
      {category === "Practice" && (
        <>
          <rect x="40" y="80" width="240" height="6" fill="#fff" opacity="0.55" />
          <rect x="60" y="60" width="200" height="6" fill="#fff" opacity="0.45" />
          <rect x="80" y="40" width="160" height="6" fill="#fff" opacity="0.35" />
        </>
      )}
      {category === "Scheme" && (
        <>
          <rect x="100" y="40" width="120" height="60" rx="8" fill="#fff" opacity="0.75" />
          <rect x="118" y="60" width="40"  height="6"  fill="hsl(0,0%,40%)" opacity="0.3" />
          <rect x="118" y="74" width="84"  height="4"  fill="hsl(0,0%,40%)" opacity="0.25" />
        </>
      )}
    </svg>
  );
}
