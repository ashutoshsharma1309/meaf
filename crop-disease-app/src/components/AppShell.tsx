/**
 * AppShell — dashboard wrapper used by the in-product pages
 * (Advisory, Mandi, Chat, Library). Provides:
 *   - persistent left sidebar with primary navigation
 *   - top bar with page title, search slot, language toggle, user chip
 *   - mobile drawer
 *   - consistent content padding
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell, BookOpenText, CloudSun, LayoutDashboard, MessageSquareText,
  Menu, Search, Sprout, Store, Stethoscope, User, X, Languages,
} from "lucide-react";
import { useLang, type Lang } from "../i18n";

type Item = { label: string; to: string; icon: typeof CloudSun; badge?: string };

const NAV: Item[] = [
  { label: "Dashboard", to: "/app",         icon: LayoutDashboard },
  { label: "Diagnose",  to: "/diagnose",    icon: Stethoscope, badge: "AI" },
  { label: "Advisory",  to: "/advisory",    icon: CloudSun },
  { label: "Mandi",     to: "/mandi",       icon: Store },
  { label: "Assistant", to: "/chat",        icon: MessageSquareText },
  { label: "Library",   to: "/library",     icon: BookOpenText },
];

export default function AppShell({
  title,
  subtitle,
  children,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightAction?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-surface-2 text-ink antialiased">
      {/* SIDEBAR (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-black/[0.06] bg-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* SIDEBAR (mobile drawer) */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black/[0.06] bg-white lg:hidden">
            <SidebarContent onClose={() => setOpen(false)} />
          </aside>
        </>
      )}

      {/* MAIN COLUMN */}
      <div className="lg:pl-64">
        <TopBar title={title} subtitle={subtitle} rightAction={rightAction} onOpenSidebar={() => setOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

/* ----- sidebar internals ----- */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-black/[0.06] px-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-700 text-white shadow-[0_2px_6px_-2px_rgba(31,124,66,0.5)]">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">KisanCare</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-black/[0.08] text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Navigation</p>
        <ul className="space-y-0.5">
          {NAV.map((it) => (
            <li key={it.to}>
              <NavLink
                to={it.to}
                end={it.to === "/app"}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2 text-[13.5px] font-medium transition ${
                    isActive ? "bg-leaf-50 text-leaf-800" : "text-ink-muted hover:bg-black/[0.04] hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-2.5">
                      <it.icon className={`h-4 w-4 ${isActive ? "text-leaf-700" : "text-ink-muted"}`} />
                      {it.label}
                    </span>
                    {it.badge && (
                      <span className="rounded-full bg-leaf-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-leaf-800">
                        {it.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <p className="mt-7 px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Resources</p>
        <ul className="space-y-0.5">
          <li><a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer"
                  className="block rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-muted hover:bg-black/[0.04] hover:text-ink">PM-KISAN</a></li>
          <li><a href="https://pmfby.gov.in" target="_blank" rel="noreferrer"
                  className="block rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-muted hover:bg-black/[0.04] hover:text-ink">PMFBY</a></li>
          <li><a href="tel:18001801551"
                  className="block rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-muted hover:bg-black/[0.04] hover:text-ink">Kisan Call Centre · 1800-180-1551</a></li>
        </ul>
      </nav>

      {/* footer user card */}
      <div className="border-t border-black/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-leaf-100 text-leaf-800">
            <User className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">Demo farmer</p>
            <p className="text-[11px] text-ink-muted">Bengaluru · 2 fields</p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ----- top bar ----- */
function TopBar({
  title, subtitle, rightAction, onOpenSidebar,
}: {
  title: string; subtitle?: string;
  rightAction?: ReactNode; onOpenSidebar: () => void;
}) {
  const { lang, setLang } = useLang();
  return (
    <div className="sticky top-0 z-20 border-b border-black/[0.06] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          onClick={onOpenSidebar}
          className="grid h-9 w-9 place-items-center rounded-lg border border-black/[0.08] bg-white text-ink lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[20px] font-semibold text-ink">{title}</h1>
          {subtitle && <p className="truncate text-[12.5px] text-ink-muted">{subtitle}</p>}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <SearchSlot />
          <LangToggle lang={lang} setLang={setLang} />
          <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-black/[0.08] bg-white text-ink-muted hover:text-ink">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-harvest-500" />
          </button>
          {rightAction}
        </div>
      </div>
    </div>
  );
}

function SearchSlot() {
  return (
    <div className="hidden items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-[12.5px] text-ink-muted md:flex md:w-72">
      <Search className="h-3.5 w-3.5" />
      <input className="w-full bg-transparent focus:outline-none" placeholder="Search crops, diseases, schemes…" />
      <kbd className="hidden rounded border border-black/[0.08] px-1 py-0.5 text-[10px] text-ink-muted md:inline">⌘K</kbd>
    </div>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-black/[0.08] bg-white p-0.5 text-[12px] font-semibold">
      <Languages className="ml-1 h-3.5 w-3.5 text-ink-muted" />
      <button onClick={() => setLang("en")}
        className={`rounded-md px-2 py-1 ${lang === "en" ? "bg-ink text-white" : "text-ink-muted"}`}>EN</button>
      <button onClick={() => setLang("hi")}
        className={`rounded-md px-2 py-1 ${lang === "hi" ? "bg-ink text-white" : "text-ink-muted"}`}>हिं</button>
    </div>
  );
}

/* small re-usable building blocks ------------------------------- */
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
      <div>
        <h2 className="font-display text-[18px] font-semibold text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-ink-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatPill({ icon: Icon, label, value, accent = "leaf" }:{
  icon: typeof CloudSun; label: string; value: string; accent?: "leaf"|"harvest"|"sky"|"earth"|"red";
}) {
  const map: Record<string, string> = {
    leaf:    "bg-leaf-50 text-leaf-800",
    harvest: "bg-harvest-50 text-harvest-800",
    sky:     "bg-sky-50 text-sky-800",
    earth:   "bg-earth-50 text-earth-800",
    red:     "bg-red-50 text-red-800",
  };
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className="flex items-center gap-2">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${map[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      </div>
      <p className="mt-2 font-display text-[22px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
