import { memo, useMemo, type CSSProperties } from 'react';
import type { BiomeDef, WeatherDef } from '@core/content';
import type { IconName } from './Icons';
import { bgSrc } from './sprites';

const PAINTED_BIOMES = new Set(['foret', 'abysses', 'montagnes', 'volcan', 'marais', 'desert', 'ombres', 'cosmos']);

/** Icône associée à chaque type d'effet météo. */
export const WEATHER_ICON: Record<WeatherDef['fx'], IconName> = {
  none: 'cloud', rain: 'rain', snow: 'snow', fog: 'fog', storm: 'bolt', stars: 'sparkle', embers: 'flame', aurora: 'sparkle', sun: 'sun', wind: 'wind',
};

function rand(seed: number) {
  let a = seed;
  return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
}

/** Effets météo animés (couche HTML au-dessus d'une scène). */
export const WeatherFx = memo(function WeatherFx({ fx, density = 1 }: { fx: WeatherDef['fx']; density?: number }) {
  const parts = useMemo(() => {
    const r = rand(fx.length * 97 + 13);
    const n = Math.round(({ rain: 60, storm: 70, snow: 45, stars: 14, embers: 26, wind: 12 } as Record<string, number>)[fx] ?? 0) * density;
    return Array.from({ length: n }, () => ({ x: r() * 100, d: r() * 3, s: 0.6 + r() * 0.8, y: r() * 100 }));
  }, [fx, density]);
  if (fx === 'none') return null;
  return (
    <div className={`wfx wfx-${fx}`} aria-hidden="true">
      {fx === 'fog' && <><i className="fog-band" /><i className="fog-band b2" /></>}
      {fx === 'aurora' && <><i className="aurora-band" /><i className="aurora-band b2" /></>}
      {fx === 'sun' && <i className="sun-glow" />}
      {fx === 'storm' && <i className="storm-flash" />}
      {parts.map((p, i) => (
        <i key={i} className="p" style={{ left: `${p.x}%`, top: fx === 'wind' || fx === 'embers' ? `${p.y}%` : undefined, animationDelay: `${-p.d}s`, ['--s' as string]: p.s } as CSSProperties} />
      ))}
    </div>
  );
});

function Shapes({ b }: { b: BiomeDef }) {
  const { ground1: g1, ground2: g2, accent: a } = b.palette;
  switch (b.scenery) {
    case 'forest':
      return (<g>
        <path d="M0 230C150 170 300 200 420 215C560 232 680 170 800 200V400H0Z" fill={g1} />
        {[[60, 250, 1.3], [180, 225, 1], [330, 240, 1.2], [520, 230, 1.1], [680, 215, 1.4], [760, 250, 0.9]].map(([x, y, k], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`}><rect x="-6" y="-4" width="12" height="40" rx="5" fill="#6a4a3a" /><circle cy="-26" r="34" fill={g2} /><circle cx="-18" cy="-12" r="22" fill={g2} opacity=".85" /><circle cx="20" cy="-16" r="24" fill="#5fc47e" opacity=".7" /></g>
        ))}
        <path d="M0 300C200 280 400 320 800 290V400H0Z" fill={g2} opacity=".6" />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} className="firefly" style={{ animationDelay: `${i * 0.4}s` }} cx={40 + i * 64} cy={150 + (i % 4) * 30} r="3" fill={a} />)}
      </g>);
    case 'volcano':
      return (<g>
        <path d="M200 260L360 90C380 70 420 70 440 90L600 260Z" fill={g1} />
        <path d="M360 90C380 70 420 70 440 90L420 110L400 95L380 112Z" fill={a} className="lava-glow" />
        <path d="M398 98C390 150 410 190 395 260" stroke={a} strokeWidth="8" fill="none" opacity=".8" className="lava-glow" />
        <path d="M0 260C200 240 600 250 800 260V400H0Z" fill={g2} />
        {[[120, 300], [640, 310], [480, 340], [260, 330]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="40" ry="14" fill={a} opacity=".35" className="lava-glow" />)}
        <circle cx="400" cy="60" r="40" fill="#7a6a7a" opacity=".5" className="smoke" />
      </g>);
    case 'peaks':
      return (<g>
        {[[80, 300, 170], [260, 300, 230], [470, 300, 200], [660, 300, 250]].map(([x, base, w], i) => (
          <g key={i}><path d={`M${x - w / 2} ${base}L${x} ${base - w * 0.9}L${x + w / 2} ${base}Z`} fill={i % 2 ? g2 : '#c8d8f0'} /><path d={`M${x - w * 0.14} ${base - w * 0.65}L${x} ${base - w * 0.9}L${x + w * 0.14} ${base - w * 0.65}L${x + w * 0.05} ${base - w * 0.6}L${x - w * 0.05} ${base - w * 0.66}Z`} fill="white" /></g>
        ))}
        <path d="M0 290C200 270 600 280 800 290V400H0Z" fill={g1} />
      </g>);
    case 'reef':
      return (<g>
        {Array.from({ length: 6 }, (_, i) => <rect key={i} x={i * 140 - 20} y="0" width="60" height="400" fill="white" opacity=".05" transform={`skewX(-15)`} />)}
        <path d="M0 300C200 280 500 310 800 290V400H0Z" fill={g2} />
        {[[90, 300], [230, 310], [560, 300], [700, 305]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}><path d="M0 0C-6-30-20-40-10-70M0 0C6-30 20-50 12-80M0 0C2-20-4-40 0-60" stroke={['#ff8ab0', '#ffb35a', '#c46fe0', '#5fe0c8'][i]} strokeWidth="9" fill="none" strokeLinecap="round" /></g>
        ))}
        {[150, 380, 470, 620].map((x, i) => <path key={i} className="seaweed" style={{ animationDelay: `${i * 0.6}s` }} d={`M${x} 320C${x - 15} 270 ${x + 15} 240 ${x} 180`} stroke="#3faa6a" strokeWidth="6" fill="none" strokeLinecap="round" />)}
        {Array.from({ length: 14 }, (_, i) => <circle key={i} className="bubble-up" style={{ animationDelay: `${i * 0.5}s` }} cx={30 + i * 55} cy="330" r={3 + (i % 3) * 2} fill="none" stroke="white" strokeWidth="1.5" opacity=".7" />)}
        <ellipse cx="420" cy="330" rx="40" ry="16" fill="#f6dcff" /><circle cx="420" cy="322" r="8" fill="white" />
      </g>);
    case 'space':
      return (<g>
        {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={(i * 137) % 800} cy={(i * 53) % 300} r={i % 5 ? 1 : 2} fill="white" className="star-twinkle" style={{ animationDelay: `${(i % 9) * 0.3}s` }} />)}
        <circle cx="620" cy="90" r="46" fill="#e05ab8" opacity=".8" /><ellipse cx="620" cy="90" rx="80" ry="14" fill="none" stroke="#ffe680" strokeWidth="3" transform="rotate(-18 620 90)" />
        {[[160, 260, 1.2], [420, 300, 1.5], [680, 280, 1]].map(([x, y, k], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`} className="float-island" style={{ animationDelay: `${i}s` }}><path d="M-80 0H80L40 50L0 70L-40 50Z" fill={g2} /><path d="M-80 0Q0-14 80 0Z" fill={g1} /></g>
        ))}
      </g>);
    case 'swamp':
      return (<g>
        <path d="M0 260C200 240 600 250 800 260V400H0Z" fill={g1} />
        {[[150, 320, 90], [470, 340, 120], [700, 310, 70]].map(([x, y, w], i) => <ellipse key={i} cx={x} cy={y} rx={w} ry="18" fill="#5a8a8a" opacity=".8" />)}
        {[[90, 270, 1.4], [330, 260, 1], [600, 265, 1.6]].map(([x, y, k], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`}><rect x="-6" y="-40" width="12" height="44" rx="5" fill="#e8dcc8" /><path d="M-36-38C-36-70 36-70 36-38Z" fill={a} /><circle cx="-12" cy="-52" r="5" fill="white" opacity=".8" /><circle cx="14" cy="-48" r="4" fill="white" opacity=".8" /></g>
        ))}
        {Array.from({ length: 8 }, (_, i) => <circle key={i} className="bubble-up" style={{ animationDelay: `${i * 0.7}s` }} cx={420 + (i % 4) * 30} cy="340" r="4" fill={a} opacity=".6" />)}
      </g>);
    case 'dunes':
      return (<g>
        <circle cx="640" cy="90" r="50" fill="#fff3b0" /><circle cx="640" cy="90" r="70" fill="#fff3b0" opacity=".3" />
        <path d="M300 250L380 160L460 250Z" fill="#d8a868" /><path d="M380 160L460 250H400Z" fill="#b8884a" />
        <path d="M0 250C150 210 300 260 450 240C600 220 700 250 800 235V400H0Z" fill={g1} />
        <path d="M0 310C200 280 400 330 800 300V400H0Z" fill={g2} />
        <g transform="translate(150 255)"><rect x="-10" y="-50" width="20" height="50" fill="#c8a070" /><rect x="-14" y="-56" width="28" height="8" fill="#b08850" /></g>
      </g>);
    case 'shadows':
      return (<g>
        <path d="M0 160L180 260L0 400Z" fill="#120c22" /><path d="M800 140L600 260L800 400Z" fill="#120c22" />
        <path d="M0 280C200 260 600 270 800 280V400H0Z" fill={g1} />
        {[[220, 280], [560, 285]].map(([x, y], i) => <path key={i} d={`M${x} ${y}V${y - 70}M${x} ${y - 40}l-24-20M${x} ${y - 55}l20-18`} stroke="#0e0a1e" strokeWidth="7" strokeLinecap="round" fill="none" />)}
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} className="float-island" style={{ animationDelay: `${i * 0.5}s` }} transform={`translate(${60 + i * 85} ${110 + (i % 3) * 45})`}><rect x="-7" y="-10" width="14" height="18" rx="4" fill="#ffc85a" /><circle r="16" fill="#ffc85a" opacity=".25" /></g>
        ))}
      </g>);
  }
}

/** Illustration d'un biome (fond + relief + animation d'ambiance). */
export const BiomeScenery = memo(function BiomeScenery({ biome, className }: { biome: BiomeDef; className?: string }) {
  const id = `sky-${biome.id}`;
  if (PAINTED_BIOMES.has(biome.id)) {
    return (
      <svg className={`biome-svg biome-painted ${className ?? ''}`} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="800" height="400" fill={biome.palette.sky2} />
        <image href={bgSrc(biome.id)} x="-20" y="-12" width="840" height="424" preserveAspectRatio="xMidYMid slice" className="bg-pan" />
      </svg>
    );
  }
  return (
    <svg className={`biome-svg ${className ?? ''}`} viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={biome.palette.sky1} /><stop offset="1" stopColor={biome.palette.sky2} /></linearGradient></defs>
      <rect width="800" height="400" fill={`url(#${id})`} />
      <Shapes b={biome} />
    </svg>
  );
});
