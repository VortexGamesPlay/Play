import type { ReactNode, SVGProps } from 'react';
import type { ElementId } from '@core/types';

/** Jeu d'icônes EGGVERSE (SVG originaux, 24×24, trait arrondi). */
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ICONS = {
  sanctuary: <g {...S}><path d="M3 20h18" /><path d="M6 20v-6a6 6 0 0 1 12 0v6" /><path d="M12 8V4" /><path d="M9.5 5.5 12 3l2.5 2.5" /><circle cx="12" cy="15" r="1.6" /></g>,
  egg: <g {...S}><path d="M12 3c3.6 0 6.5 5.4 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.4 8.4 3 12 3Z" /><path d="m8.5 12 2 1.5 1.8-2 1.8 2 1.6-1.4" /></g>,
  paw: <g {...S}><ellipse cx="12" cy="16" rx="4.5" ry="3.6" /><circle cx="6" cy="10.5" r="1.8" /><circle cx="9.5" cy="6.5" r="1.8" /><circle cx="14.5" cy="6.5" r="1.8" /><circle cx="18" cy="10.5" r="1.8" /></g>,
  book: <g {...S}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /><path d="m12 7 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 9.3l2-.3Z" /></g>,
  flask: <g {...S}><path d="M9 3h6" /><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7 15h10" /><circle cx="11" cy="18" r=".6" fill="currentColor" /></g>,
  compass: <g {...S}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></g>,
  swords: <g {...S}><path d="M14.5 17.5 3 6V3h3l11.5 11.5" /><path d="m13 19 6-6" /><path d="m16 16 4 4" /><path d="m19 21 2-2" /><path d="M9.5 6.5 18 3h3v3l-3.5 8.5" /></g>,
  bag: <g {...S}><path d="M5 8h14l-1.2 12H6.2Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></g>,
  people: <g {...S}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2a5 5 0 0 1 5.5 4.8" /></g>,
  backpack: <g {...S}><path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" /><path d="M9 4.5V3h6v1.5" /><path d="M9 14h6v4H9z" /></g>,
  gear: <g {...S}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></g>,
  more: <g {...S}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></g>,
  close: <g {...S}><path d="M6 6l12 12M18 6 6 18" /></g>,
  check: <g {...S}><path d="m5 12.5 4.5 4.5L19 7" /></g>,
  lock: <g {...S}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></g>,
  clock: <g {...S}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>,
  bolt: <g {...S}><path d="M13 2 4 14h7l-1 8 9-12h-7Z" /></g>,
  star: <g {...S}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" /></g>,
  starFill: <path fill="currentColor" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  heart: <g {...S}><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" /></g>,
  heartFill: <path fill="currentColor" d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
  sparkle: <g {...S}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" /></g>,
  sun: <g {...S}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>,
  moon: <g {...S}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></g>,
  search: <g {...S}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></g>,
  plus: <g {...S}><path d="M12 5v14M5 12h14" /></g>,
  edit: <g {...S}><path d="M4 20h4L19 9l-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></g>,
  leaf: <g {...S}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19 13 11" /></g>,
  gift: <g {...S}><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12" /><path d="M12 8C10 4 6.5 4.5 7.5 7c.4 1 4.5 1 4.5 1s4.1 0 4.5-1C17.5 4.5 14 4 12 8Z" /></g>,
  scroll: <g {...S}><path d="M7 4h11a2 2 0 0 1 2 2v1h-4" /><path d="M16 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h10" /><path d="M7 4a2 2 0 0 0-2 2v11" /><path d="M9 9h4M9 13h4" /></g>,
  info: <g {...S}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></g>,
  warning: <g {...S}><path d="M12 3 2 20h20Z" /><path d="M12 10v4M12 17v.5" /></g>,
  dice: <g {...S}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="15" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" /><circle cx="9" cy="15" r="1" fill="currentColor" /></g>,
  download: <g {...S}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></g>,
  upload: <g {...S}><path d="M12 20V9M7 14l5-5 5 5M5 4h14" /></g>,
  trash: <g {...S}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></g>,
  save: <g {...S}><path d="M5 4h11l3 3v13H5Z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></g>,
  harvest: <g {...S}><path d="M4 13h16l-1.5 7h-13Z" /><circle cx="9" cy="9" r="2.5" /><circle cx="15" cy="8" r="2.5" /><circle cx="12" cy="5" r="2" /></g>,
  zzz: <g {...S}><path d="M4 6h5l-5 6h5M13 10h4l-4 5h4" /></g>,
  arrowRight: <g {...S}><path d="M5 12h14M13 6l6 6-6 6" /></g>,
  volume: <g {...S}><path d="M4 9h4l5-4v14l-5-4H4Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></g>,
  motion: <g {...S}><path d="M3 12h4l3-7 4 14 3-7h4" /></g>,
  trophy: <g {...S}><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z" /></g>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      {ICONS[name]}
    </svg>
  );
}

/* ── Monnaies ── */
export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" fill="#ffb81f" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="#e08a00" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" fill="#ffd45e" />
      <path d="M12 7.5c1.8 0 3.2 2.2 3.2 4.2a3.2 3.2 0 0 1-6.4 0c0-2 1.4-4.2 3.2-4.2Z" fill="#ffb81f" />
      <ellipse cx="9" cy="8" rx="2.2" ry="1.2" fill="#fff6d0" opacity=".8" transform="rotate(-30 9 8)" />
    </svg>
  );
}
export function CrystalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2 20 9l-8 13L4 9Z" fill="#4fd8ff" />
      <path d="M12 2 16 9l-4 13L8 9Z" fill="#9cefff" />
      <path d="M4 9h16" stroke="#1fa8d8" strokeWidth="1.2" />
      <path d="M12 2 20 9l-8 13L4 9Z" fill="none" stroke="#1fa8d8" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 5.5 10.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
export function EssenceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 2c3 4.5 7 8 7 12a7 7 0 0 1-14 0c0-4 4-7.5 7-12Z" fill="#c36bff" />
      <path d="M12 2c3 4.5 7 8 7 12a7 7 0 0 1-14 0c0-4 4-7.5 7-12Z" fill="none" stroke="#8a2ee0" strokeWidth="1.4" />
      <path d="M12 9c1.6 2.4 3.4 4 3.4 6a3.4 3.4 0 0 1-6.8 0c0-2 1.8-3.6 3.4-6Z" fill="#ffb3ff" opacity=".8" />
      <circle cx="9.3" cy="12" r="1.2" fill="white" opacity=".85" />
    </svg>
  );
}

export function CurrencyIcon({ currency, ...rest }: { currency: 'coins' | 'crystals' | 'essence' } & SVGProps<SVGSVGElement>) {
  if (currency === 'coins') return <CoinIcon {...rest} />;
  if (currency === 'crystals') return <CrystalIcon {...rest} />;
  return <EssenceIcon {...rest} />;
}

/* ── Éléments ── */
const ELEMENT_PATHS: Record<ElementId, ReactNode> = {
  feu: <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9Z" fill="currentColor" />,
  eau: <path d="M12 3c3 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6.5 6-11Z" fill="currentColor" />,
  nature: <path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15l-1-1Zm0 0 8-8" fill="currentColor" stroke="white" strokeWidth="1.2" strokeLinecap="round" />,
  glace: <g {...S} strokeWidth="2.2"><path d="M12 2v20M3.5 7l17 10M3.5 17l17-10M9.5 4 12 6.5 14.5 4M9.5 20 12 17.5 14.5 20" /></g>,
  air: <g {...S} strokeWidth="2.2"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" /></g>,
  terre: <path d="M2 20 9 7l4 6 2-3 7 10Z" fill="currentColor" />,
  foudre: <path d="M13 2 4 14h7l-1 8 9-12h-7Z" fill="currentColor" />,
  lumiere: <g><circle cx="12" cy="12" r="4.5" fill="currentColor" /><g {...S}><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></g></g>,
  ombre: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="currentColor" />,
  vapeur: <path d="M7 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 8.5 4.5 4.5 0 0 1 17.5 18Z" fill="currentColor" />,
  cosmique: <g><path d="m12 5 1.8 4.2 4.2 1.8-4.2 1.8L12 17l-1.8-4.2L6 11l4.2-1.8Z" fill="currentColor" /><ellipse cx="12" cy="11" rx="10" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-20 12 11)" /></g>,
  cristal: <path d="M12 2 19 9l-7 13L5 9Z" fill="currentColor" />,
  toxique: <g fill="currentColor"><circle cx="9" cy="14" r="5" /><circle cx="16" cy="8" r="3.5" /><circle cx="17.5" cy="17" r="2.2" /></g>,
  spectre: <path d="M12 3a7 7 0 0 1 7 7v10l-2.3-1.6L14.3 20 12 18.4 9.7 20l-2.4-1.6L5 20V10a7 7 0 0 1 7-7Z" fill="currentColor" />,
  primordial: <g {...S} strokeWidth="2.2"><path d="M12 12a1.5 1.5 0 1 1 1.5 1.5A3 3 0 0 1 10.5 10.5 4.5 4.5 0 0 1 15 6a6 6 0 0 1 6 6 7.5 7.5 0 0 1-7.5 7.5A9 9 0 0 1 3 12" /></g>,
};

export function ElementIcon({ element, ...rest }: { element: ElementId } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      {ELEMENT_PATHS[element]}
    </svg>
  );
}
