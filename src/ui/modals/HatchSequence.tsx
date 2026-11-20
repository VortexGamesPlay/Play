import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { GameEvent } from '@core/events';
import { getSpecies } from '@core/systems/creatures';
import { RARITIES } from '@data/rarities';
import { MUTATIONS } from '@data/mutations';
import { CreatureArt } from '../art/CreatureArt';
import { EggArt } from '../art/EggArt';
import { CrystalIcon, Icon } from '../art/Icons';
import { ElementBadge, MutationBadge, RarityBadge } from '../components/Badges';
import { useUi } from '../../store/uiStore';
import { playSfx, preloadSfx } from '../../services/audio';

type Hatched = Extract<GameEvent, { type: 'hatched' }>;

/**
 * Séquence d'éclosion : tremblement → fissures → lumière → particules → ouverture → apparition.
 * La durée et l'intensité augmentent avec la rareté. Toucher l'écran passe directement à la révélation.
 */
export function HatchSequence({ event }: { event: Hatched }) {
  const { closeModal, openModal } = useUi.getState();
  const c = event.creature;
  const sp = getSpecies(c.speciesId);
  const rarity = RARITIES[sp.rarity];
  const tier = rarity.tier;
  const eggType = c.origin.kind === 'egg' ? c.origin.eggType : c.origin.kind === 'breeding' ? 'hybride' : 'forestier';
  const tease = tier >= 3 ? 900 : 0;
  const timeline = useMemo(() => [0, 800, 1500, 2200 + tease, 2900 + tease, 3300 + tease], [tease]);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = timeline.slice(1).map((t, i) => setTimeout(() => setStage((s) => Math.max(s, i + 1)), t));
    return () => timers.forEach(clearTimeout);
  }, [timeline]);

  useEffect(() => { preloadSfx(['revealEpic', 'mutation']); }, []);

  useEffect(() => {
    if (stage >= 1 && stage <= 3) playSfx('crack');
    if (stage === 4) playSfx('whoosh');
    if (stage === 5) {
      playSfx('reveal', tier);
      if (c.mutations.length > 0) setTimeout(() => playSfx('mutation'), 900);
    }
  }, [stage, tier, c.mutations.length]);

  const particles = useMemo(() => Array.from({ length: 14 + tier * 6 }, (_, i) => {
    const a = (i / (14 + tier * 6)) * Math.PI * 2 + Math.random() * 0.4;
    const d = 120 + Math.random() * (140 + tier * 20);
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, s: 6 + Math.random() * 10, delay: Math.random() * 0.25, star: i % 3 === 0 };
  }), [tier]);

  const revealed = stage >= 5;
  const skip = () => { if (!revealed) setStage(5); };
  const style = { ['--rc' as string]: rarity.color, ['--rg' as string]: rarity.glow } as CSSProperties;

  return (
    <div className={`hatch hs-${stage} fx-${rarity.fx} tier-${tier}`} style={style} onClick={skip} role="dialog" aria-modal="true" aria-label="Éclosion">
      <div className="hatch-bg" />
      {stage >= 3 && tier >= 3 && !revealed && <div className="hatch-tease">Une énergie {tier >= 5 ? 'extraordinaire' : 'puissante'} s'échappe de l'œuf…</div>}
      <div className="hatch-stage">
        <div className="hatch-rays" />
        <div className="hatch-light" />
        {stage < 4 && (
          <div className="hatch-egg">
            <EggArt type={eggType} size={150} cracks={Math.min(3, stage)} />
          </div>
        )}
        {stage >= 4 && (
          <>
            <div className="hatch-half top"><EggArt type={eggType} size={150} cracks={3} /></div>
            <div className="hatch-half bottom"><EggArt type={eggType} size={150} cracks={3} /></div>
            <div className="hatch-flash" />
            <div className="hatch-particles">
              {particles.map((p, i) => (
                <i key={i} className={p.star ? 'star' : ''} style={{ ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px`, width: p.s, height: p.s, animationDelay: `${p.delay}s` } as CSSProperties} />
              ))}
            </div>
          </>
        )}
        {revealed && (
          <div className="hatch-creature">
            <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={230} seed={c.uid} />
          </div>
        )}
      </div>

      {revealed ? (
        <div className="hatch-panel" onClick={(e) => e.stopPropagation()}>
          {event.newSpecies && <div className="ribbon"><Icon name="starFill" />Nouvelle espèce découverte !</div>}
          <div className="hatch-dex muted num">N° {String(sp.dex).padStart(3, '0')} · {sp.family}</div>
          <h2 className="hatch-name">{sp.name}</h2>
          <div className="row-wrap" style={{ justifyContent: 'center' }}>
            <RarityBadge rarity={sp.rarity} />
            <ElementBadge element={sp.element} />
            {c.mutations.map((m) => <MutationBadge key={m} mutation={m} />)}
          </div>
          {event.newVariants.length > 0 && (
            <p className="hatch-variant"><Icon name="sparkle" />Variante {event.newVariants.map((m) => MUTATIONS[m]?.name).join(' + ')} enregistrée dans le Bestiaire !</p>
          )}
          {event.crystalsAwarded > 0 && <p className="hatch-bonus"><CrystalIcon width={18} height={18} />+{event.crystalsAwarded} cristaux de découverte</p>}
          <div className="row" style={{ justifyContent: 'center', marginTop: 14, gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => { closeModal(); openModal({ kind: 'creature', uid: c.uid }); }}>Voir la fiche</button>
            <button className="btn btn-pink" onClick={closeModal}>Continuer</button>
          </div>
        </div>
      ) : (
        <div className="hatch-skip">Toucher pour passer</div>
      )}
    </div>
  );
}
