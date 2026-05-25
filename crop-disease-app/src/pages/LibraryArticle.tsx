/**
 * LibraryArticle — knowledge-base article detail page (/library/:slug).
 */
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Clock, Tag } from "lucide-react";
import AppShell from "../components/AppShell";
import { ARTICLES, CAT_TINT, findArticle } from "../data/articles";

export default function LibraryArticle() {
  const { slug = "" } = useParams();
  const article = findArticle(slug);

  if (!article) {
    return (
      <AppShell title="Article not found" subtitle="That article isn't in the library">
        <div className="rounded-2xl border border-dashed border-black/[0.10] bg-white p-12 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-ink-muted/60" />
          <p className="mt-3 text-[14px] font-semibold text-ink">We couldn't find that article</p>
          <p className="mt-1 text-[12.5px] text-ink-muted">It may have moved or never existed.</p>
          <Link to="/library" className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-black/[0.10] bg-white px-4 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Library
          </Link>
        </div>
      </AppShell>
    );
  }

  const related = (article.related ?? [])
    .map((s) => ARTICLES.find((a) => a.slug === s))
    .filter((a): a is typeof ARTICLES[number] => Boolean(a));

  return (
    <AppShell
      title={article.title}
      subtitle={article.category}
      rightAction={
        <Link to="/library" className="hidden items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-surface-2 lg:inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" /> All articles
        </Link>
      }
    >
      {/* breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-[12px] text-ink-muted">
        <Link to="/library" className="hover:text-ink">Library</Link>
        <ChevronRight className="h-3 w-3" />
        <span>{article.category}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-ink">{article.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* article body */}
        <article className="rounded-2xl border border-black/[0.06] bg-white p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CAT_TINT[article.category]}`}>
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-muted">
              <Clock className="h-3 w-3" /> {article.reading_min} min read
            </span>
          </div>

          <h1 className="mt-3 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[40px]">
            {article.title}
          </h1>

          {article.hero_note && (
            <p className="mt-4 rounded-xl border border-leaf-200 bg-leaf-50/50 px-4 py-3 text-[14px] leading-relaxed text-leaf-900">
              {article.hero_note}
            </p>
          )}

          <p className="mt-6 text-[16px] leading-[1.7] text-ink-muted">{article.excerpt}</p>

          <div className="mt-8 space-y-7">
            {article.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-[20px] font-semibold tracking-tight text-ink">{s.heading}</h2>
                <p className="mt-2 text-[14.5px] leading-[1.75] text-ink/80">{s.body}</p>
                {s.bullets && (
                  <ul className="mt-3 space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink/80">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="list-disc marker:text-leaf-500">{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* tags + sources */}
          <div className="mt-10 border-t border-black/[0.06] pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <Tag className="h-3 w-3" /> Tags
              </span>
              {article.tags.map((t) => (
                <span key={t} className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11.5px] text-ink-muted">
                  {t}
                </span>
              ))}
            </div>
            {article.sources && article.sources.length > 0 && (
              <p className="mt-4 text-[12px] text-ink-muted">
                Sources · {article.sources.map((s, i) => (
                  <span key={s} className="italic">{i > 0 ? " · " : ""}{s}</span>
                ))}
              </p>
            )}
          </div>

          {/* primary CTA */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-surface-2/60 p-4">
            <p className="text-[13.5px] text-ink-muted">
              See this disease in your field? Get an AI diagnosis in seconds.
            </p>
            <Link to="/diagnose" className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-leaf-800">
              Diagnose a leaf <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </article>

        {/* related sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">In this article</p>
            <ul className="mt-3 space-y-2">
              {article.sections.map((s, i) => (
                <li key={i} className="text-[13px] text-ink-muted">
                  <span className="mr-2 inline-block w-6 tabular-nums text-ink-muted/60">0{i + 1}</span>
                  {s.heading}
                </li>
              ))}
            </ul>
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Related</p>
              <ul className="mt-3 space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to={`/library/${r.slug}`}
                      className="group block rounded-lg border border-transparent p-2 transition hover:border-leaf-200 hover:bg-leaf-50/40"
                    >
                      <p className="text-[13px] font-semibold text-ink group-hover:text-leaf-800">{r.title}</p>
                      <p className="text-[11.5px] text-ink-muted">{r.category} · {r.reading_min} min</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to="/chat"
            className="block rounded-2xl border border-leaf-200 bg-leaf-50/60 p-4 hover:bg-leaf-50"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-leaf-700">Got a question?</p>
            <p className="mt-1 font-display text-[15px] font-semibold text-ink">Ask the assistant</p>
            <p className="mt-1 text-[12.5px] text-ink-muted">Plain-English answers about your crops.</p>
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
