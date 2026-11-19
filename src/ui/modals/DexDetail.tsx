import type { CSSProperties } from 'react';
import { EGGS } from '@data/eggs';
import { MUTATIONS } from '@data/mutations';
import { RARITIES } from '@data/rarities';
import { SPECIES, SPECIES_LIST } from '@data/species';
import { isDiscovered } from '@core/systems/dex';
import { speciesOdds } from '@core/systems/odds';
import type { SpeciesDef } from '@core/content';
import { CreatureArt } from '../art/CreatureArt';
import { ElementIcon, Icon } from '../art/Icons';
import { ElementBadge, RarityBadge } from '../components/Badges';
import { Bar } from '../components/Bar';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { conditionText, fmtDateTime, foodTagName } from '../format';
import { formatPct } from './OddsModal';
import { ELEMENTS } from '@data/elements';
import { RECIPES } from '@data/recipes';

/** Remonte jusqu'à la forme de base puis liste toute la lignée. */
function evolutionLine(sp: SpeciesDef): SpeciesDef[] {
  let root = sp;
  for (;;) {
    const parent = SPECIES_LIST.find((s) => s.evolutions.some((e) => e.to === root.id));
    if (!parent) break;
    root = parent;
  }
  const out: SpeciesDef[] = [];
  const walk = (s: SpeciesDef) => { out.push(s); s.evolutions.forEach((e) => walk(SPECIES[e.to]!)); };
  walk(root);
  return out;
}

export function DexDetail({ speciesId }: { speciesId: string }) {
  const state = useGame((s) => s.state);
  const openModal = useUi((s) => s.openModal);
  const sp = SPECIES[speciesId]!;
  const known = isDiscovered(state, speciesId);
  const entry = state.dex[speciesId];
  const r = RARITIES[sp.rarity];
  const eggs = Object.values(EGGS).filter((e) => e.pool.some((p) => p.species === speciesId));
  const line = evolutionLine(sp);
  const style = { ['--rc' as string]: r.color, ['--rg' as string]: r.glow } as CSSProperties;

  if (!known) {
    return (
      <div className="stack dex-detail" style={style}>
        <div className="dex-detail-art unknown"><CreatureArt speciesId={speciesId} size={190} anim="none" silhouette /></div>
        <div style={{ textAlign: 'center' }}>
          <div className="muted num" style={{ fontWeight: 800 }}>N° {String(sp.dex).padStart(3, '0')}</div>
          <h2>{sp.rarity === 'secret' ? 'Entrée scellée' : 'Espèce inconnue'}</h2>
          <p className="soft" style={{ marginTop: 6 }}>{sp.rarity === 'secret' ? 'Les archives refusent de s\'ouvrir. Certains disent qu\'il faut unir deux forces opposées…' : 'Une silhouette aperçue dans les vieilles archives. Personne ne l\'a encore élevée dans ce sanctuaire.'}</p>
        </div>
        <h3 className="detail-h">Indices</h3>
        <div className="stack" style={{ gap: 8 }}>
          {eggs.length > 0 && (
            <div className="status-panel"><Icon name="egg" /><div><b>Peut éclore de :</b><div className="row-wrap" style={{ marginTop: 6 }}>{eggs.map((e) => <button key={e.id} className="chip" onClick={() => openModal({ kind: 'odds', eggType: e.id })}>{e.name} · {formatPct(speciesOdds(e.id).find((o) => o.speciesId === speciesId)!.probability)}</button>)}</div></div></div>
          )}
          {sp.obtainableBy.includes('evolution') && <div className="status-panel"><Icon name="sparkle" /><p>Cette créature naît de l'évolution d'une autre espèce. Observe les fiches de tes créatures : leurs chemins d'évolution y sont décrits.</p></div>}
          {RECIPES.filter((r) => r.result === speciesId).map((r) => (
            <div key={r.id} className="status-panel"><Icon name="flask" /><p>Une recette du Laboratoire génétique murmure : <b>« {r.hint} »</b></p></div>
          ))}
          <div className="status-panel"><ElementIcon element={sp.element} style={{ color: ELEMENTS[sp.element].color }} /><p>Une trace d'énergie <b>{ELEMENTS[sp.element].name}</b> a été relevée.</p></div>
        </div>
      </div>
    );
  }

  const max = 120;
  return (
    <div className="stack dex-detail" style={style}>
      <div className="dex-detail-art"><CreatureArt speciesId={speciesId} size={190} seed={speciesId} /></div>
      <div style={{ textAlign: 'center' }}>
        <div className="muted num" style={{ fontWeight: 800 }}>N° {String(sp.dex).padStart(3, '0')} · {sp.family}</div>
        <h2 style={{ fontSize: 26 }}>{sp.name}</h2>
        <div className="row-wrap" style={{ justifyContent: 'center', marginTop: 6 }}><RarityBadge rarity={sp.rarity} /><ElementBadge element={sp.element} /><span className="badge soft-badge">{{ bebe: 'Bébé', juvenile: 'Juvénile', adulte: 'Adulte', ancestral: 'Ancestral' }[sp.stage]}</span></div>
        <p className="soft" style={{ marginTop: 10 }}>{sp.description}</p>
      </div>

      <dl className="kv">
        <dt>Taille moyenne</dt><dd>{sp.sizeCm ? `${sp.sizeCm} cm` : '???'}</dd>
        <dt>Poids moyen</dt><dd>{sp.weightKg ? `${sp.weightKg} kg` : '???'}</dd>
        <dt>Aliments préférés</dt><dd>{sp.favoriteFood.map(foodTagName).join(', ')}</dd>
        <dt>Obtenue</dt><dd>{entry!.obtainedCount} fois · première le {fmtDateTime(entry!.firstObtainedAt!)}</dd>
      </dl>

      <h3 className="detail-h">Statistiques de base</h3>
      <div className="stats">
        {([['PV', sp.baseStats.hp, '#3fcf9f'], ['Attaque', sp.baseStats.atk, '#ff7a5c'], ['Défense', sp.baseStats.def, '#5cb8ff'], ['Vitesse', sp.baseStats.spd, '#ffc23d']] as const).map(([l, v, c]) => (
          <div key={l} className="stat-row"><span className="stat-l">{l}</span><Bar value={v / max} fill={c} size="thin" /><b className="num">{v}</b></div>
        ))}
      </div>

      {line.length > 1 && (
        <>
          <h3 className="detail-h">Lignée d'évolution</h3>
          <div className="evo-line">
            {line.map((s, i) => {
              const k = isDiscovered(state, s.id);
              const cond = line.find((x) => x.evolutions.some((e) => e.to === s.id))?.evolutions.find((e) => e.to === s.id)?.conditions;
              return (
                <div key={s.id} className="evo-step">
                  {i > 0 && <div className="evo-arrow"><Icon name="arrowRight" /><span>{cond?.map(conditionText).join(' · ')}</span></div>}
                  <button className={`evo-node ${s.id === speciesId ? 'current' : ''}`} onClick={() => s.id !== speciesId && openModal({ kind: 'dex', speciesId: s.id })}>
                    <CreatureArt speciesId={s.id} size={64} anim="none" silhouette={!k} />
                    <b>{k ? s.name : '???'}</b>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h3 className="detail-h">Variantes observées <span className="badge soft-badge">{entry!.variants.length}/{Object.keys(MUTATIONS).length}</span></h3>
      <div className="variant-grid">
        {Object.values(MUTATIONS).map((m) => {
          const seen = entry!.variants.includes(m.id);
          return (
            <div key={m.id} className={`variant ${seen ? 'seen' : ''}`} title={seen ? m.description : 'Variante non observée'}>
              {seen ? <CreatureArt speciesId={speciesId} mutations={[m.id]} size={56} anim="none" /> : <CreatureArt speciesId={speciesId} size={56} anim="none" silhouette />}
              <span>{seen ? m.name : '?'}</span>
            </div>
          );
        })}
      </div>

      {eggs.length > 0 && (
        <>
          <h3 className="detail-h">Où la trouver</h3>
          <div className="row-wrap">{eggs.map((e) => <button key={e.id} className="chip" onClick={() => openModal({ kind: 'odds', eggType: e.id })}>{e.name} · {formatPct(speciesOdds(e.id).find((o) => o.speciesId === speciesId)!.probability)}</button>)}</div>
        </>
      )}
    </div>
  );
}
