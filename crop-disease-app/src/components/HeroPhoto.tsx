/**
 * HeroPhoto — full-bleed cinematic hero background built from layered SVG.
 *
 * Layers (bottom → top):
 *   1. warm sky gradient
 *   2. soft sun-glow
 *   3. distant hills
 *   4. crop-field plane with rows converging to the horizon
 *   5. centred tractor silhouette spraying down the rows
 *
 * Designed so the headline and CTA float above it without needing an
 * external photo asset.
 */

export default function HeroPhoto() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      {/* Sky → horizon gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #faf8f3 0%, #f0eee5 35%, #e3e0cf 52%, #afc592 56%, #6f9a52 62%, #426e2d 78%, #2b4d1c 100%)",
        }}
      />

      {/* Soft sun glow */}
      <div
        className="absolute"
        style={{
          left: "50%", top: "32%", transform: "translate(-50%, -50%)",
          width: 900, height: 600,
          background:
            "radial-gradient(ellipse at center, rgba(255,236,170,0.55), rgba(255,236,170,0.0) 65%)",
          filter: "blur(6px)",
        }}
      />

      {/* Distant hill silhouette */}
      <svg
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="absolute inset-x-0"
        style={{ top: "47%", height: "8%" }}
      >
        <path
          d="M0 200 C 200 80 350 140 520 110 C 720 70 900 150 1080 120 C 1240 96 1340 130 1440 105 L 1440 220 L 0 220 Z"
          fill="#85a368"
          opacity="0.6"
        />
        <path
          d="M0 220 C 220 165 420 200 640 175 C 900 145 1100 200 1280 175 C 1360 165 1420 175 1440 170 L 1440 220 L 0 220 Z"
          fill="#6a8a4f"
          opacity="0.85"
        />
      </svg>

      {/* Crop-field rows with perspective */}
      <svg
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0"
        style={{ height: "55%" }}
      >
        <defs>
          <linearGradient id="field" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4d7c34" />
            <stop offset="55%" stopColor="#2d5a1c" />
            <stop offset="100%" stopColor="#1c3f12" />
          </linearGradient>
          <linearGradient id="row" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#83a566" stopOpacity="0" />
            <stop offset="35%" stopColor="#83a566" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#83a566" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="1440" height="600" fill="url(#field)" />
        {/* perspective rows — many vertical lines converging at the vanishing point (720, 0) */}
        {Array.from({ length: 60 }).map((_, i) => {
          const offset = (i - 30) / 30;        // -1 .. 1
          const sign = Math.sign(offset || 1);
          const t = Math.abs(offset);
          const x = 720 + sign * Math.pow(t, 1.2) * 1700;
          return (
            <line
              key={i}
              x1={720} y1={0}
              x2={x} y2={600}
              stroke="url(#row)"
              strokeWidth={1.4}
              opacity={0.7 - t * 0.45}
            />
          );
        })}
        {/* haze near horizon */}
        <rect width="1440" height="120" fill="url(#hazeMask)" />
        <defs>
          <linearGradient id="hazeMask" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e6e2cf" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#e6e2cf" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tractor silhouette (rear view, centered, sitting on the horizon) */}
      <div
        className="absolute"
        style={{
          left: "50%", top: "63%", transform: "translate(-50%, -50%)",
          width: "min(640px, 70vw)",
        }}
      >
        <Tractor />
      </div>

      {/* Soft vignette so headline has more contrast */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 18%, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%)",
        }}
      />
    </div>
  );
}

/* ----- detailed rear-view tractor SVG ----- */
function Tractor() {
  return (
    <svg viewBox="0 0 640 360" className="w-full">
      <defs>
        <linearGradient id="cab" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fefefe" />
          <stop offset="100%" stopColor="#d7d3c8" />
        </linearGradient>
        <linearGradient id="roof" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#e9e6dc" />
          <stop offset="100%" stopColor="#bbb6a6" />
        </linearGradient>
        <linearGradient id="tire" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2a2725" />
          <stop offset="100%" stopColor="#0e0d0c" />
        </linearGradient>
        <linearGradient id="boom" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a4291e" />
          <stop offset="50%" stopColor="#c43225" />
          <stop offset="100%" stopColor="#a4291e" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dy="6" />
          <feComponentTransfer><feFuncA type="linear" slope="0.35" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="320" cy="320" rx="220" ry="14" fill="#000" opacity="0.28" />

      {/* spray boom — wide red horizontal */}
      <g filter="url(#softShadow)">
        <rect x="20" y="252" width="600" height="10" rx="4" fill="url(#boom)" />
        {/* nozzles along the boom */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 40 + i * (560 / 13);
          return <rect key={i} x={x - 1.5} y="260" width="3" height="14" fill="#7a1d14" />;
        })}
        {/* mist near the bottom of nozzles */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 40 + i * (560 / 13);
          return (
            <ellipse key={`m${i}`} cx={x} cy="284" rx="9" ry="3"
              fill="#fff" opacity="0.18" />
          );
        })}
      </g>

      {/* chassis */}
      <rect x="220" y="190" width="200" height="80" rx="12" fill="#a6a297" />

      {/* tires */}
      <g filter="url(#softShadow)">
        <circle cx="180" cy="240" r="58" fill="url(#tire)" />
        <circle cx="180" cy="240" r="22" fill="#2a2725" stroke="#444038" strokeWidth="3" />
        <circle cx="180" cy="240" r="6"  fill="#9a958a" />
        <circle cx="460" cy="240" r="58" fill="url(#tire)" />
        <circle cx="460" cy="240" r="22" fill="#2a2725" stroke="#444038" strokeWidth="3" />
        <circle cx="460" cy="240" r="6"  fill="#9a958a" />
      </g>

      {/* cabin */}
      <g filter="url(#softShadow)">
        <rect x="232" y="74" width="176" height="124" rx="14" fill="url(#cab)" stroke="#c5c1b6" strokeWidth="2" />
        {/* roof */}
        <rect x="222" y="64" width="196" height="20" rx="7" fill="url(#roof)" />
        {/* mirror arms */}
        <rect x="210" y="86" width="22" height="3" fill="#7a766c" />
        <rect x="408" y="86" width="22" height="3" fill="#7a766c" />
        <rect x="205" y="82" width="8" height="14" rx="2" fill="#3a3733" />
        <rect x="427" y="82" width="8" height="14" rx="2" fill="#3a3733" />
        {/* rear window — single wide pane */}
        <rect x="246" y="92" width="148" height="64" rx="6" fill="#1e2a1f" opacity="0.85" />
        {/* a silhouette of the driver */}
        <ellipse cx="320" cy="120" rx="22" ry="22" fill="#3b3b35" opacity="0.7" />
        <rect x="298" y="138" width="44" height="22" rx="6" fill="#3b3b35" opacity="0.7" />
        {/* hazard sign */}
        <rect x="318" y="160" width="4" height="14" fill="#d9534f" />
      </g>

      {/* exhaust pipe stub */}
      <rect x="240" y="46" width="10" height="40" rx="3" fill="#2a2725" />
      <ellipse cx="245" cy="44" rx="6" ry="3" fill="#1c1a18" />

      {/* tank on top of cabin */}
      <ellipse cx="320" cy="58" rx="80" ry="10" fill="#e9e6dc" />
      <ellipse cx="320" cy="56" rx="80" ry="9" fill="#fefefe" />

      {/* small front lights bar (rear of tractor visible to viewer) */}
      <rect x="260" y="186" width="120" height="6" rx="2" fill="#3a3733" />
      <circle cx="280" cy="189" r="3" fill="#ffcb5b" />
      <circle cx="320" cy="189" r="3" fill="#ffcb5b" />
      <circle cx="360" cy="189" r="3" fill="#ffcb5b" />
    </svg>
  );
}
