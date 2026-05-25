/**
 * Advisory — weather + 7-day forecast + crop calendar + field alerts.
 *
 * All data is mock/seed for the demo. Designed to look like a real
 * agritech dashboard with denser cards, charts and tables.
 */
import { useMemo } from "react";
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ChevronRight,
  Cloud, CloudRain, CloudSun, Droplets, Leaf, MapPin, Sprout,
  Sun, Sunset, Thermometer, Wind, Zap,
} from "lucide-react";
import AppShell, { SectionHeader, StatPill } from "../components/AppShell";

/* ---------- mock data ---------- */
const TODAY = {
  location: "Bengaluru, KA",
  temp_c: 27,
  feels_c: 28,
  humidity: 62,
  wind_kmph: 8,
  rain_pct: 22,
  uv: 6,
  air_quality: "Moderate",
  sunrise: "06:14",
  sunset: "18:38",
  summary: "Partly cloudy with light afternoon breeze — good day to scout fields.",
};

type Day = {
  day: string; date: string;
  cond: "sun" | "cloud" | "cloud-sun" | "rain";
  tmax: number; tmin: number; rain: number; wind: number; spray: boolean;
};
const FORECAST: Day[] = [
  { day: "Mon", date: "25", cond: "cloud-sun", tmax: 28, tmin: 19, rain: 22, wind: 8,  spray: true  },
  { day: "Tue", date: "26", cond: "sun",       tmax: 30, tmin: 20, rain: 8,  wind: 6,  spray: true  },
  { day: "Wed", date: "27", cond: "cloud",     tmax: 28, tmin: 21, rain: 35, wind: 11, spray: false },
  { day: "Thu", date: "28", cond: "rain",      tmax: 25, tmin: 20, rain: 78, wind: 14, spray: false },
  { day: "Fri", date: "29", cond: "rain",      tmax: 24, tmin: 19, rain: 62, wind: 13, spray: false },
  { day: "Sat", date: "30", cond: "cloud-sun", tmax: 26, tmin: 19, rain: 28, wind: 9,  spray: true  },
  { day: "Sun", date: "31", cond: "sun",       tmax: 29, tmin: 20, rain: 6,  wind: 7,  spray: true  },
];

const CALENDAR: Array<{
  date: string; title: string; crop: string; type: "spray"|"sow"|"irrigate"|"harvest"|"scout";
  body: string;
}> = [
  { date: "Today",     title: "Scout for early blight",       crop: "Tomato",  type: "scout",    body: "Walk the field at dawn. Check lower leaves for concentric brown rings." },
  { date: "Tomorrow",  title: "Spray Mancozeb 75% WP",        crop: "Tomato",  type: "spray",    body: "Best window 06:00–10:00. Rain risk only 8%. Wear mask + gloves." },
  { date: "27 May",    title: "Irrigate Field-B (potato)",    crop: "Potato",  type: "irrigate", body: "Soil moisture dropping after 4 dry days. Drip 35 min, evening." },
  { date: "30 May",    title: "Top-dress urea",               crop: "Potato",  type: "sow",      body: "30 kg/acre, broadcast just before light rain forecast." },
  { date: "02 Jun",    title: "Harvest window opens",         crop: "Tomato",  type: "harvest",  body: "Pick fully red fruits from oldest cluster first. Refrigerate within 4 h." },
];

const ALERTS = [
  { level: "warn", icon: AlertTriangle, title: "Early-blight risk rising", body: "Humidity has stayed >75% for 3 nights. Pre-emptive Mancozeb spray recommended on tomato.", action: "Open diagnose", to: "/diagnose" },
  { level: "info", icon: Droplets,      title: "Rain expected Thu / Fri",   body: "Avoid spraying chemicals between 27 → 29 May. Move planned spray to Tuesday morning.", action: "View calendar", to: "#calendar" },
  { level: "ok",   icon: CheckCircle2,  title: "Field-A soil moisture healthy", body: "Latest reading 28% (target 22-32%). No irrigation needed for 48h.", action: "Field details", to: "#" },
];

/* ---------- helpers ---------- */
const CondIcon = ({ cond, className = "h-6 w-6" }: { cond: Day["cond"]; className?: string }) => {
  switch (cond) {
    case "sun":       return <Sun className={`${className} text-harvest-500`} strokeWidth={1.6} />;
    case "cloud":     return <Cloud className={`${className} text-ink-muted`} strokeWidth={1.6} />;
    case "cloud-sun": return <CloudSun className={`${className} text-harvest-500`} strokeWidth={1.6} />;
    case "rain":      return <CloudRain className={`${className} text-sky-600`} strokeWidth={1.6} />;
  }
};

const TypeIcon = ({ type }: { type: typeof CALENDAR[number]["type"] }) => {
  const map = {
    spray:    { Icon: Droplets,   cls: "bg-leaf-50 text-leaf-700" },
    sow:      { Icon: Sprout,     cls: "bg-harvest-50 text-harvest-700" },
    irrigate: { Icon: Droplets,   cls: "bg-sky-50 text-sky-700" },
    harvest:  { Icon: Leaf,       cls: "bg-earth-50 text-earth-700" },
    scout:    { Icon: AlertTriangle, cls: "bg-red-50 text-red-700" },
  } as const;
  const { Icon, cls } = map[type];
  return <div className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg ${cls}`}><Icon className="h-4 w-4" /></div>;
};

/* ============================================================ */
export default function Advisory() {
  return (
    <AppShell
      title="Advisory"
      subtitle="Weather, spray windows, and your crop calendar"
      rightAction={
        <button className="hidden items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-surface-2 lg:inline-flex">
          <MapPin className="h-3.5 w-3.5" /> {TODAY.location}
        </button>
      }
    >
      <TodayHero />
      <SevenDay />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Calendar /></div>
        <Alerts />
      </div>
    </AppShell>
  );
}

/* ----- today hero ----- */
function TodayHero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br from-leaf-50 via-white to-sky-50">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-leaf-700">Today · {TODAY.location}</p>
          <div className="mt-2 flex items-end gap-4">
            <div className="font-display text-[68px] font-semibold leading-none tracking-[-0.03em] text-ink">{TODAY.temp_c}°</div>
            <div className="pb-2 leading-tight">
              <p className="text-[13px] font-semibold text-ink">Feels {TODAY.feels_c}°</p>
              <p className="text-[12px] text-ink-muted">High 28° · Low 19°</p>
            </div>
            <CloudSun className="ml-auto h-20 w-20 text-harvest-500" strokeWidth={1.1} />
          </div>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-muted">{TODAY.summary}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-[12px]">
            <BadgeRow icon={Droplets}    label={`${TODAY.rain_pct}% rain`} />
            <BadgeRow icon={Wind}        label={`${TODAY.wind_kmph} km/h`} />
            <BadgeRow icon={Thermometer} label={`humidity ${TODAY.humidity}%`} />
            <BadgeRow icon={Sun}         label={`UV ${TODAY.uv}`} />
            <BadgeRow icon={Sunset}      label={`${TODAY.sunrise} → ${TODAY.sunset}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatPill icon={Droplets}    label="Rain chance" value={`${TODAY.rain_pct}%`} accent="sky" />
          <StatPill icon={Wind}        label="Wind"        value={`${TODAY.wind_kmph} km/h`} accent="leaf" />
          <StatPill icon={Thermometer} label="Humidity"    value={`${TODAY.humidity}%`} accent="earth" />
          <StatPill icon={Zap}         label="Spray window" value="GO" accent="leaf" />
        </div>
      </div>
    </section>
  );
}

function BadgeRow({ icon: Icon, label }: { icon: typeof Sun; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-2.5 py-1 font-medium text-ink">
      <Icon className="h-3 w-3 text-ink-muted" /> {label}
    </span>
  );
}

/* ----- 7-day forecast ----- */
function SevenDay() {
  return (
    <section className="mt-8">
      <SectionHeader title="7-day forecast" sub="Spray-window: green days are clear, low wind, low rain" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {FORECAST.map((d, i) => (
          <div
            key={d.day}
            className={`relative rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(11,31,23,0.15)] ${
              d.spray ? "border-leaf-200 bg-leaf-50/50" : "border-black/[0.06] bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{d.day}</p>
              {i === 0 && <span className="rounded-full bg-leaf-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Today</span>}
            </div>
            <p className="font-display text-[20px] font-semibold leading-none">{d.date} May</p>
            <div className="mt-3"><CondIcon cond={d.cond} className="h-8 w-8" /></div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[22px] font-semibold tabular-nums">{d.tmax}°</span>
              <span className="text-[12px] text-ink-muted">{d.tmin}°</span>
            </div>
            <div className="mt-3 space-y-1 border-t border-black/[0.04] pt-2 text-[11px] text-ink-muted">
              <div className="flex items-center gap-1"><Droplets className="h-3 w-3" /> {d.rain}%</div>
              <div className="flex items-center gap-1"><Wind className="h-3 w-3" /> {d.wind} km/h</div>
            </div>
            <p className={`mt-2 text-[10.5px] font-semibold uppercase tracking-wider ${d.spray ? "text-leaf-700" : "text-ink-muted"}`}>
              {d.spray ? "Spray OK" : "Hold spray"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----- crop calendar ----- */
function Calendar() {
  return (
    <section id="calendar" className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <SectionHeader
        title="This week's crop calendar"
        sub="Auto-generated from your field profile and current weather"
        action={
          <button className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-leaf-700 hover:text-leaf-800">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        }
      />
      <ol className="relative space-y-3 border-l border-black/[0.06] pl-5">
        {CALENDAR.map((e, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-[26px] top-3 grid h-3 w-3 place-items-center rounded-full bg-white">
              <span className="h-2 w-2 rounded-full bg-leaf-600" />
            </span>
            <div className="flex items-start gap-3 rounded-xl border border-black/[0.05] bg-surface-2/60 p-3.5">
              <TypeIcon type={e.type} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{e.title}</p>
                  <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{e.crop}</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{e.body}</p>
              </div>
              <div className="text-right text-[11px] text-ink-muted">
                <CalendarDays className="ml-auto h-3.5 w-3.5" />
                <p className="mt-1 font-semibold text-ink">{e.date}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ----- alerts column ----- */
function Alerts() {
  const tone = (l: string) => ({
    warn: { wrap: "border-harvest-200 bg-harvest-50/50", chip: "bg-harvest-100 text-harvest-800", iconC: "text-harvest-700" },
    info: { wrap: "border-sky-200 bg-sky-50/50",         chip: "bg-sky-100 text-sky-800",         iconC: "text-sky-700" },
    ok:   { wrap: "border-leaf-200 bg-leaf-50/50",       chip: "bg-leaf-100 text-leaf-800",       iconC: "text-leaf-700" },
  } as any)[l];

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <SectionHeader title="Field alerts" sub="Updated 6 minutes ago" />
      <ul className="space-y-3">
        {ALERTS.map((a, i) => {
          const t = tone(a.level);
          const Icon = a.icon;
          return (
            <li key={i} className={`rounded-xl border ${t.wrap} p-3.5`}>
              <div className="flex items-start gap-2.5">
                <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${t.iconC}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{a.body}</p>
                  <a href={a.to} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-leaf-700 hover:text-leaf-800">
                    {a.action} <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// suppress unused import warning since useMemo is reserved for chart later
export const _u = useMemo;
