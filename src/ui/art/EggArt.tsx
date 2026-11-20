import { memo, useId, useState, type ReactNode } from 'react';
import type { EggVisual } from '@core/content';
import { EGGS } from '@data/eggs';
import { darken, lighten } from './color';
import { eggSrc } from './sprites';

const EGG_PATH = 'M50 4C77 4 94 48 94 76C94 104 74 120 50 120C26 120 6 104 6 76C6 48 23 4 50 4Z';

function PatternLayer({ v, rid }: { v: EggVisual; rid: string }): ReactNode {
  const s = v.secondary;
  switch (v.pattern) {
    case 'leaves':
      return <g fill={s}>{[[28, 50, -30], [70, 40, 30], [40, 88, 10], [76, 82, -20], [52, 22, 0]].map(([x, y, r], i) => <path key={i} transform={`translate(${x} ${y}) rotate(${r})`} d="M0 10C-10 4-10-8 0-12C10-8 10 4 0 10Z" opacity=".8" />)}</g>;
    case 'waves':
      return <g fill="none" stroke={s} strokeWidth="5" strokeLinecap="round" opacity=".7">{[44, 66, 88].map((y) => <path key={y} d={`M4 ${y}q12-10 24 0t24 0 24 0 24 0`} />)}</g>;
    case 'lava':
      return <g fill="none" stroke={s} strokeWidth="3.5" strokeLinecap="round" filter={`url(#${rid}-glow)`} className="egg-pulse"><path d="M30 20l8 18-6 14 10 16" /><path d="M70 30l-8 16 10 12-6 20" /><path d="M20 80l14 4 6 16" /><path d="M80 90l-12 6-2 14" /></g>;
    case 'clouds':
      return <g fill="white" opacity=".85">{[[30, 48], [68, 70], [36, 94]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><circle r="9" /><circle cx="10" cy="2" r="7" /><circle cx="-9" cy="3" r="6" /></g>)}<path d="M66 30l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z" fill="#ffe680" /></g>;
    case 'wisps':
      return <g fill="none" stroke={s} strokeWidth="4" strokeLinecap="round" opacity=".65"><path d="M24 40c10-10 24 0 18 10s8 14 18 6" /><path d="M40 84c10-8 22 2 30-6" /><path d="M58 24c6 4 12 2 14-4" /></g>;
    case 'runes':
      return <g fill="none" stroke={s} strokeWidth="3" strokeLinecap="round" className="egg-pulse"><rect x="10" y="62" width="80" height="10" rx="3" fill={s} opacity=".25" stroke="none" /><path d="M28 40l6-10 6 10M31 36h6" /><path d="M60 34v12l6-6" /><circle cx="50" cy="96" r="6" /><path d="M24 92h10M29 87v10M66 88l8 8M74 88l-8 8" /></g>;
    case 'veins':
      return <g fill="none" stroke={s} strokeWidth="3" strokeLinecap="round" filter={`url(#${rid}-glow)`} className="egg-pulse"><path d="M50 4c-6 20 8 30-2 50s10 30 0 66" /><path d="M48 54c-14 4-20 16-34 18" /><path d="M50 80c12 0 18 10 34 8" /><path d="M54 30c10 4 18 0 26 6" /></g>;
    case 'prism':
      return <g opacity=".75">{['#ff6fb5', '#ffb03d', '#ffe66b', '#6ff0a8', '#5fc8ff', '#a87aff'].map((c, i) => <path key={c} d={`M${-20 + i * 22} 130L${20 + i * 22} -10`} stroke={c} strokeWidth="11" />)}</g>;
    case 'galaxy':
      return <g><ellipse cx="50" cy="64" rx="34" ry="14" transform="rotate(-25 50 64)" fill={s} opacity=".6" /><ellipse cx="50" cy="64" rx="18" ry="7" transform="rotate(-25 50 64)" fill="#ff8ae0" opacity=".5" />{[[24, 36], [72, 30], [30, 96], [76, 92], [50, 20], [62, 64], [40, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 2.2} fill="white" className="egg-twinkle" style={{ animationDelay: `${i * 0.3}s` }} />)}</g>;
    case 'helix':
      return <g fill="none" strokeWidth="4" strokeLinecap="round" className="egg-pulse"><path d="M30 0C70 20 30 40 70 60S30 100 70 130" stroke={s} /><path d="M70 0C30 20 70 40 30 60S70 100 30 130" stroke="#ff9fd0" />{[12, 34, 56, 78, 100].map((y) => <path key={y} d={`M38 ${y + 4}h24`} stroke={s} strokeWidth="2.5" opacity=".5" />)}</g>;
    case 'crown':
      return <g><rect x="0" y="58" width="100" height="14" fill={s} /><path d="M0 58h100" stroke="#fff3c4" strokeWidth="2" /><circle cx="30" cy="65" r="4" fill="#ff6fb5" /><circle cx="50" cy="65" r="5" fill="#5fc8ff" /><circle cx="70" cy="65" r="4" fill="#6ff0a8" /><path d="M34 30l6-10 10 8 10-8 6 10z" fill={s} opacity=".8" /></g>;
  }
}

const CRACKS = [
  'M50 30l-6 10 8 6-4 10',
  'M30 58l10 4 4-8 10 6 8-6 12 4',
  'M62 84l-8 8 6 6-10 8M20 76l8 2',
];

export interface EggArtProps {
  type: string;
  size?: number;
  /** Nombre de fissures visibles (0..3) — utilisé pendant l'éclosion. */
  cracks?: number;
  wobble?: boolean;
  className?: string;
}

function EggArtImpl({ type, size = 100, cracks = 0, wobble = false, className }: EggArtProps) {
  const rid = useId().replace(/:/g, '');
  const [failed, setFailed] = useState(false);
  const egg = EGGS[type];
  if (!egg) return null;
  const v = egg.visual;
  if (!failed) {
    return (
      <svg viewBox="0 0 100 130" width={size} height={size * 1.3} className={`egg egg-painted ${wobble ? 'egg-wobble' : ''} ${className ?? ''}`} role="img" aria-label={egg.name}>
        <defs>
          <filter id={`${rid}-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <radialGradient id={`${rid}-halo`}><stop offset="0" stopColor={v.glow} stopOpacity=".45" /><stop offset="1" stopColor={v.glow} stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx="50" cy="70" rx="56" ry="62" fill={`url(#${rid}-halo)`} className="egg-halo" />
        <ellipse cx="50" cy="125" rx="30" ry="4.5" fill="#2b1e5a" opacity=".18" />
        <g className="egg-body">
          <image href={eggSrc(type)} x="0" y="0" width="100" height="130" preserveAspectRatio="xMidYMax meet" onError={() => setFailed(true)} />
          {cracks > 0 && (
            <g fill="none" stroke={v.glow} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${rid}-glow)`}>
              {CRACKS.slice(0, cracks).map((d, i) => <path key={i} d={d} className="egg-crack" />)}
            </g>
          )}
        </g>
      </svg>
    );
  }
  const dark = v.pattern === 'galaxy' || v.pattern === 'veins' || v.pattern === 'lava';
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} className={`egg ${wobble ? 'egg-wobble' : ''} ${className ?? ''}`} role="img" aria-label={egg.name}>
      <defs>
        <radialGradient id={`${rid}-fill`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor={lighten(v.base, dark ? 10 : 8)} />
          <stop offset=".6" stopColor={v.base} />
          <stop offset="1" stopColor={darken(v.base, 12)} />
        </radialGradient>
        <filter id={`${rid}-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <clipPath id={`${rid}-clip`}><path d={EGG_PATH} /></clipPath>
      </defs>
      <ellipse cx="50" cy="124" rx="32" ry="5" fill="#2b1e5a" opacity=".15" />
      <g className="egg-body">
        <path d={EGG_PATH} fill={`url(#${rid}-fill)`} />
        <g clipPath={`url(#${rid}-clip)`}><PatternLayer v={v} rid={rid} /></g>
        <ellipse cx="34" cy="32" rx="10" ry="16" fill="white" opacity=".35" transform="rotate(20 34 32)" />
        <path d={EGG_PATH} fill="none" stroke={darken(v.base, 25)} strokeWidth="3" />
        {cracks > 0 && (
          <g fill="none" stroke={v.glow} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${rid}-glow)`}>
            {CRACKS.slice(0, cracks).map((d, i) => <path key={i} d={d} className="egg-crack" />)}
          </g>
        )}
      </g>
    </svg>
  );
}

export const EggArt = memo(EggArtImpl);
