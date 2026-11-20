import { useEffect, useRef, useState, type ReactNode } from 'react';
import { isNight } from '@core/time';
import { sanctuaryWeather } from '@core/systems/weather';
import { WEATHER_ICON } from '../art/Scenery';
import { CurrencyIcon, Icon } from '../art/Icons';
import { useGame } from '../../store/gameStore';
import { useUi, type Route } from '../../store/uiStore';
import { useBadges } from '../hooks/useBadges';
import { useNow } from '../hooks/useNow';
import { playSfx } from '../../services/audio';
import { NAV_MAIN, NAV_OTHER, NAV_WORLD, TITLES, type NavEntry } from './nav';
import { tr, intlLocale } from '../../i18n';

function Logo() {
  return (
    <div className="logo">
      <svg width="40" height="46" viewBox="0 0 100 120" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9fd0" /><stop offset=".5" stopColor="#a58bff" /><stop offset="1" stopColor="#6fd8ff" /></linearGradient></defs>
        <path d="M50 4C77 4 94 48 94 76C94 104 74 116 50 116C26 116 6 104 6 76C6 48 23 4 50 4Z" fill="url(#lg)" stroke="#5a3ee0" strokeWidth="4" />
        <path d="M20 66l12 8 10-10 10 10 12-10 10 8 6-4" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="34" cy="34" rx="8" ry="14" fill="white" opacity=".5" transform="rotate(20 34 34)" />
      </svg>
      <div>
        <div className="logo-word">{tr('EGGVERSE')}</div>
        <div className="logo-sub">{tr('Le monde des créatures oubliées')}</div>
      </div>
    </div>
  );
}

function NavButton({ n, active, badge, onClick }: { n: NavEntry; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <Icon name={n.icon} width={22} height={22} />
      {tr(n.label)}
      {badge ? <span className="nav-badge">{badge}</span> : n.phase ? <span className="soon">{tr('Phase')} {n.phase}</span> : null}
    </button>
  );
}

function Sidebar() {
  const route = useUi((s) => s.route);
  const navigate = useUi((s) => s.navigate);
  const badges = useBadges();
  const go = (r: Route) => { playSfx('tap'); navigate(r); };
  const render = (list: NavEntry[]) => list.map((n) => <NavButton key={n.route} n={n} active={route === n.route} badge={badges[n.route]} onClick={() => go(n.route)} />);
  return (
    <nav className="sidebar" aria-label={tr('Navigation principale')}>
      <Logo />
      {render(NAV_MAIN)}
      <div className="nav-section">{tr('Monde')}</div>
      {render(NAV_WORLD)}
      <div className="nav-section">{tr('Gardien')}</div>
      {render(NAV_OTHER)}
    </nav>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 500);
      setShown(Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString(intlLocale())}</>;
}

function CurrencyPill({ currency, value, label }: { currency: 'coins' | 'crystals' | 'essence'; value: number; label: string }) {
  const [bump, setBump] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value !== prev.current) { setBump(true); const t = setTimeout(() => setBump(false), 450); prev.current = value; return () => clearTimeout(t); }
  }, [value]);
  return (
    <div className={`currency tip ${bump ? 'bump' : ''}`} data-tip={label}>
      <CurrencyIcon currency={currency} className="ic" />
      <span className="num"><AnimatedNumber value={value} /></span>
    </div>
  );
}

function TopBar() {
  const route = useUi((s) => s.route);
  const wallet = useGame((s) => s.state.wallet);
  const now = useNow();
  const night = isNight(new Date(now).getHours());
  const weather = sanctuaryWeather(now);
  return (
    <header className="topbar">
      <h1>{tr(TITLES[route])}</h1>
      <span className="logo-word">{tr('EGGVERSE')}</span>
      <div className="currencies">
        <CurrencyPill currency="coins" value={wallet.coins} label={tr('Pièces : achats, constructions')} />
        <CurrencyPill currency="crystals" value={wallet.crystals} label={tr('Cristaux : objets rares, accélérations')} />
        <CurrencyPill currency="essence" value={wallet.essence} label={tr('Essence : génétique et mutations')} />
      </div>
      <div className="daynight tip" data-tip={tr('Météo du sanctuaire : {name}', { name: weather.name })}><Icon name={WEATHER_ICON[weather.fx]} style={{ color: '#5cb8ff' }} /><span>{weather.name}</span></div>
      <div className="daynight tip" data-tip={night ? tr('Nuit (20h–6h) : mutations cosmiques renforcées') : tr('Jour (6h–20h)')}>
        <Icon name={night ? 'moon' : 'sun'} style={{ color: night ? '#7b5cff' : '#ffb000' }} />
        <span>{night ? tr('Nuit') : tr('Jour')}</span>
      </div>
    </header>
  );
}

const MOBILE_TABS: NavEntry[] = NAV_MAIN;

function BottomBar() {
  const route = useUi((s) => s.route);
  const navigate = useUi((s) => s.navigate);
  const setMore = useUi((s) => s.setMoreOpen);
  const badges = useBadges();
  const inMore = !MOBILE_TABS.some((t) => t.route === route);
  return (
    <nav className="bottombar" aria-label={tr('Navigation')}>
      {MOBILE_TABS.map((t) => (
        <button key={t.route} className={`tab ${route === t.route ? 'active' : ''}`} onClick={() => { playSfx('tap'); navigate(t.route); }}>
          <Icon name={t.icon} />{tr(t.label)}
          {badges[t.route] ? <span className="nav-badge">{badges[t.route]}</span> : null}
        </button>
      ))}
      <button className={`tab ${inMore ? 'active' : ''}`} onClick={() => { playSfx('open'); setMore(true); }}>
        <Icon name="more" />{tr('Plus')}
      </button>
    </nav>
  );
}

function MoreSheet() {
  const open = useUi((s) => s.moreOpen);
  const setMore = useUi((s) => s.setMoreOpen);
  const navigate = useUi((s) => s.navigate);
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={() => setMore(false)} />
      <div className="sheet" role="dialog" aria-label={tr('Plus de sections')}>
        <div className="sheet-grip" />
        <div className="sheet-grid">
          {[...NAV_WORLD, ...NAV_OTHER].map((n) => (
            <button key={n.route} className="sheet-item" onClick={() => { playSfx('tap'); navigate(n.route); }}>
              <Icon name={n.icon} />{tr(n.label)}
              {n.phase && <span className="soon">{tr('Phase')} {n.phase}</span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const route = useUi((s) => s.route);
  const reduced = useGame((s) => s.state.settings.reducedMotion);
  return (
    <div className={`shell ${reduced ? 'reduced-motion' : ''}`}>
      <div className="app-bg" aria-hidden="true">
        <div className="blob" style={{ width: 380, height: 380, left: '8%', top: '12%', background: '#ffc2e6' }} />
        <div className="blob" style={{ width: 460, height: 460, right: '-6%', top: '40%', background: '#c2e8ff', animationDelay: '-8s' }} />
        <div className="blob" style={{ width: 340, height: 340, left: '40%', bottom: '-10%', background: '#c8ffe0', animationDelay: '-15s' }} />
      </div>
      <Sidebar />
      <div className="main">
        <TopBar />
        <main className="content" key={route}>
          <div className="screen-enter">{children}</div>
        </main>
      </div>
      <BottomBar />
      <MoreSheet />
    </div>
  );
}
