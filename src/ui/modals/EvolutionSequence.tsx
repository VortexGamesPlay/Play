import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { GameEvent } from '@core/events';
import { getSpecies } from '@core/systems/creatures';
import { RARITIES } from '@data/rarities';
import { CreatureArt } from '../art/CreatureArt';
import { CrystalIcon, Icon } from '../art/Icons';
import { ElementBadge, RarityBadge } from '../components/Badges';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { playSfx, preloadSfx } from '../../services/audio';
import { tr } from '../../i18n';

type Evolved = Extract<GameEvent, { type: 'evolved' }>;

/**
 * Cinématique d'évolution : la créature s'illumine, sa silhouette alterne de plus en plus vite
 * entre l'ancienne et la nouvelle forme, puis un éclair révèle la nouvelle espèce.
 */
export function EvolutionSequence({ event }: { event: Evolved }) {
  const { closeModal, openModal } = useUi.getState();
  const c = useGame((s) => s.state.creatures.find((x) => x.uid === event.uid));
  const from = getSpecies(event.from);
  const to = getSpecies(event.to);
  const r = RARITIES[to.rarity];
  const [stage, setStage] = useState(0); // 0 lueur · 1 alternance · 2 éclair · 3 révélation
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { preloadSfx(['revealEpic']); }, []);

  useEffect(() => {
    const t = [setTimeout(() => setStage(1), 1100), setTimeout(() => setStage(2), 4200), setTimeout(() => setStage(3), 4700)];
    return () => t.forEach(clearTimeout);
  }, []);

  // Alternance qui accélère
  useEffect(() => {
    if (stage !== 1) return;
    let delay = 420;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const flip = () => {
      if (!alive) return;
      setShowNew((v) => !v);
      playSfx('tap');
      delay = Math.max(60, delay * 0.8);
      timer = setTimeout(flip, delay);
    };
    timer = setTimeout(flip, delay);
    return () => { alive = false; clearTimeout(timer); };
  }, [stage]);

  useEffect(() => {
    if (stage === 2) playSfx('whoosh');
    if (stage === 3) playSfx('reveal', r.tier + 1);
  }, [stage, r.tier]);

  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    const d = 140 + Math.random() * 120;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, s: 6 + Math.random() * 8, delay: Math.random() * 0.2 };
  }), []);

  if (!c) return null;
  const revealed = stage >= 3;
  const style = { ['--rc' as string]: r.color, ['--rg' as string]: r.glow } as CSSProperties;

  return (
    <div className={`hatch evo evo-${stage} ${revealed ? 'hs-5' : ''}`} style={style} onClick={() => !revealed && setStage(3)} role="dialog" aria-modal="true" aria-label={tr('Évolution')}>
      <div className="hatch-bg" />
      {!revealed && <div className="hatch-tease">{stage === 0 ? tr('{p0} se met à briller…', { p0: c.nickname || from.name }) : tr('Quelque chose change !')}</div>}
      <div className="hatch-stage">
        <div className="hatch-rays" />
        <div className="hatch-light" />
        {!revealed && (
          <div className="evo-body">
            <CreatureArt speciesId={stage === 1 && showNew ? to.id : from.id} mutations={c.mutations} hue={c.genes.hue} size={220} anim="idle" seed={c.uid} />
          </div>
        )}
        {stage >= 2 && <div className="hatch-flash" />}
        {revealed && (
          <>
            <div className="hatch-particles">
              {particles.map((p, i) => <i key={i} style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, width: p.s, height: p.s, animationDelay: `${p.delay}s` } as CSSProperties} />)}
            </div>
            <div className="hatch-creature"><CreatureArt speciesId={to.id} mutations={c.mutations} hue={c.genes.hue} size={240} seed={c.uid} /></div>
          </>
        )}
      </div>
      {revealed ? (
        <div className="hatch-panel" onClick={(e) => e.stopPropagation()}>
          {event.newSpecies && <div className="ribbon"><Icon name="starFill" />{tr('Nouvelle espèce découverte !')}</div>}
          <p className="soft" style={{ fontWeight: 800 }}>{c.nickname || from.name} {tr('a évolué en')}</p>
          <h2 className="hatch-name">{to.name}</h2>
          <div className="row-wrap" style={{ justifyContent: 'center' }}><RarityBadge rarity={to.rarity} /><ElementBadge element={to.element} /></div>
          {event.crystalsAwarded > 0 && <p className="hatch-bonus"><CrystalIcon width={18} height={18} />+{event.crystalsAwarded} {tr('cristaux de découverte')}</p>}
          <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => { closeModal(); openModal({ kind: 'creature', uid: c.uid }); }}>{tr('Voir la fiche')}</button>
            <button className="btn btn-pink" onClick={closeModal}>{tr('Continuer')}</button>
          </div>
        </div>
      ) : <div className="hatch-skip">{tr('Toucher pour passer')}</div>}
    </div>
  );
}
