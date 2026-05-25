/**
 * Mandi — daily market prices dashboard.
 * Shows nearby mandis, top crops with sparklines, and a detailed table.
 */
import { useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowUpRight, MapPin, Search, Store, TrendingUp, Wallet,
} from "lucide-react";
import AppShell, { SectionHeader, StatPill } from "../components/AppShell";

/* ---------- mock data ---------- */
const MANDIS = [
  { id: "yeshwantpur", name: "Yeshwantpur APMC", city: "Bengaluru", distance_km: 14 },
  { id: "ramanagara",  name: "Ramanagara",        city: "Karnataka", distance_km: 48 },
  { id: "kolar",       name: "Kolar APMC",        city: "Karnataka", distance_km: 71 },
  { id: "tumkur",      name: "Tumkur",            city: "Karnataka", distance_km: 70 },
];

type Crop = {
  name: string; variety: string; unit: "quintal" | "kg";
  min: number; modal: number; max: number;
  change_pct: number;   // vs last week
  trend: number[];      // 7-day modal prices
};

const CROPS: Crop[] = [
  { name: "Tomato",  variety: "Local",      unit: "quintal", min: 1200, modal: 1450, max: 1800, change_pct: +6.4, trend: [1300,1280,1310,1360,1380,1410,1450] },
  { name: "Potato",  variety: "Jyoti",      unit: "quintal", min: 1100, modal: 1280, max: 1500, change_pct: +2.3, trend: [1230,1240,1240,1260,1255,1270,1280] },
  { name: "Onion",   variety: "Bellary Red",unit: "quintal", min: 1450, modal: 1750, max: 2050, change_pct: -3.7, trend: [1820,1810,1790,1780,1760,1755,1750] },
  { name: "Brinjal", variety: "Long Purple",unit: "quintal", min:  900, modal: 1100, max: 1380, change_pct: +1.1, trend: [1060,1080,1085,1090,1095,1095,1100] },
  { name: "Chilli",  variety: "Byadgi",     unit: "quintal", min: 9500, modal: 12500,max: 14800,change_pct: +8.2, trend: [11200,11400,11800,12100,12200,12350,12500] },
  { name: "Maize",   variety: "Yellow",     unit: "quintal", min: 1850, modal: 2010, max: 2160, change_pct: -1.4, trend: [2050,2045,2040,2030,2025,2018,2010] },
  { name: "Cotton",  variety: "Bunny",      unit: "quintal", min: 6800, modal: 7250, max: 7800, change_pct: +4.6, trend: [6940,6970,7020,7090,7130,7190,7250] },
  { name: "Paddy",   variety: "Sona Masoori",unit:"quintal", min: 2150, modal: 2280, max: 2420, change_pct: +0.9, trend: [2260,2265,2268,2270,2275,2278,2280] },
  { name: "Wheat",   variety: "Sharbati",   unit: "quintal", min: 2480, modal: 2620, max: 2790, change_pct: -0.4, trend: [2630,2635,2628,2625,2620,2618,2620] },
];

/* ============================================================ */
export default function Mandi() {
  const [mandi, setMandi] = useState(MANDIS[0].id);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => CROPS.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.variety.toLowerCase().includes(query.toLowerCase())),
    [query]
  );
  const top = [...CROPS].sort((a, b) => b.change_pct - a.change_pct).slice(0, 4);

  const selected = MANDIS.find(m => m.id === mandi)!;

  return (
    <AppShell
      title="Mandi prices"
      subtitle={`Live wholesale prices · last updated 12 min ago`}
      rightAction={
        <button className="hidden items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-surface-2 lg:inline-flex">
          <Wallet className="h-3.5 w-3.5" /> Sell on KisanCare
        </button>
      }
    >
      {/* mandi selector + summary stats */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-leaf-700">Selected mandi</p>
              <h2 className="mt-1 font-display text-[22px] font-semibold leading-tight">{selected.name}</h2>
              <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-ink-muted">
                <MapPin className="h-3 w-3" /> {selected.city} · {selected.distance_km} km away
              </p>
            </div>
            <select
              value={mandi} onChange={(e) => setMandi(e.target.value)}
              className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-semibold focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
            >
              {MANDIS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill icon={Store}        label="Crops listed" value={String(CROPS.length)} accent="leaf" />
            <StatPill icon={TrendingUp}   label="Top gainer"   value={`+${top[0].change_pct}%`} accent="leaf" />
            <StatPill icon={ArrowDownRight} label="Biggest dip" value={`${[...CROPS].sort((a,b)=>a.change_pct-b.change_pct)[0].change_pct}%`} accent="red" />
            <StatPill icon={Wallet}       label="Avg modal"    value="₹3,360" accent="harvest" />
          </div>
        </section>

        {/* top movers */}
        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
          <SectionHeader title="Top movers" sub="Last 7 days" />
          <ul className="space-y-3">
            {top.map((c, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-black/[0.05] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <CropIcon name={c.name} />
                  <div className="min-w-0 leading-tight">
                    <p className="truncate font-semibold text-ink">{c.name}</p>
                    <p className="text-[11.5px] text-ink-muted">{c.variety}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkline data={c.trend} positive={c.change_pct >= 0} />
                  <ChangeChip pct={c.change_pct} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* detailed price table */}
      <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
        <SectionHeader
          title="All crops"
          sub="Min · modal · max prices per quintal"
          action={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search crop or variety…"
                className="w-64 rounded-lg border border-black/[0.08] bg-white py-1.5 pl-8 pr-3 text-[13px] focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-200"
              />
            </div>
          }
        />

        {/* desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-black/[0.05] md:block">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3">Variety</th>
                <th className="px-4 py-3 text-right">Min ₹</th>
                <th className="px-4 py-3 text-right">Modal ₹</th>
                <th className="px-4 py-3 text-right">Max ₹</th>
                <th className="px-4 py-3 text-right">7-day</th>
                <th className="px-4 py-3 text-right">vs last wk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.name} className={`border-t border-black/[0.05] ${i % 2 ? "bg-surface-2/40" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-ink">
                    <span className="inline-flex items-center gap-2">
                      <CropIcon name={c.name} size="sm" />
                      {c.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{c.variety}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">₹{c.min.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">₹{c.modal.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink">₹{c.max.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3"><div className="ml-auto w-fit"><Sparkline data={c.trend} positive={c.change_pct >= 0} /></div></td>
                  <td className="px-4 py-3 text-right"><ChangeChip pct={c.change_pct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile cards */}
        <ul className="space-y-3 md:hidden">
          {filtered.map((c) => (
            <li key={c.name} className="rounded-xl border border-black/[0.06] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CropIcon name={c.name} />
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-[11.5px] text-ink-muted">{c.variety}</p>
                  </div>
                </div>
                <ChangeChip pct={c.change_pct} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <PriceCol label="min"   value={`₹${c.min}`} />
                <PriceCol label="modal" value={`₹${c.modal}`} bold />
                <PriceCol label="max"   value={`₹${c.max}`} />
              </div>
              <div className="mt-3"><Sparkline data={c.trend} positive={c.change_pct >= 0} width={280} height={32} /></div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[11px] text-ink-muted">
          Demo data shaped after Agmarknet. In production: live feed via{" "}
          <a href="https://agmarknet.gov.in" target="_blank" rel="noreferrer" className="text-leaf-700 underline">Agmarknet</a>
          {" "}+ market-channel logistics.
        </p>
      </section>
    </AppShell>
  );
}

/* ---------- bits ---------- */
function PriceCol({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2/60 p-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`mt-0.5 tabular-nums ${bold ? "font-bold text-ink" : "text-ink-muted"}`}>{value}</p>
    </div>
  );
}

function ChangeChip({ pct }: { pct: number }) {
  const up = pct >= 0;
  const cls = up ? "bg-leaf-50 text-leaf-800" : "bg-red-50 text-red-700";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums ${cls}`}>
      <Icon className="h-3 w-3" /> {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function Sparkline({
  data, positive, width = 96, height = 28,
}: { data: number[]; positive: boolean; width?: number; height?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const color = positive ? "#1f7c42" : "#b91c1c";
  const id = `g-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${id})`}
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CROP_TINT: Record<string, string> = {
  Tomato:  "from-red-100 to-red-50 text-red-700",
  Potato:  "from-earth-100 to-earth-50 text-earth-700",
  Onion:   "from-harvest-100 to-harvest-50 text-harvest-700",
  Brinjal: "from-purple-100 to-purple-50 text-purple-700",
  Chilli:  "from-red-100 to-red-50 text-red-700",
  Maize:   "from-yellow-100 to-yellow-50 text-yellow-700",
  Cotton:  "from-stone-100 to-stone-50 text-stone-700",
  Paddy:   "from-leaf-100 to-leaf-50 text-leaf-700",
  Wheat:   "from-amber-100 to-amber-50 text-amber-700",
};
function CropIcon({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const letter = name.charAt(0);
  return (
    <div className={`grid ${s} flex-shrink-0 place-items-center rounded-full bg-gradient-to-br ${CROP_TINT[name] || "from-leaf-100 to-leaf-50 text-leaf-700"}`}>
      <span className="font-display text-[14px] font-bold">{letter}</span>
    </div>
  );
}
