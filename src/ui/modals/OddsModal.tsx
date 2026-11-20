import { useState, type CSSProperties } from 'react';
import { AMBIANCES } from '@data/ambiances';
import { EGGS } from '@data/eggs';
import { MUTATIONS } from '@data/mutations';
import { RARITIES, RARITY_ORDER } from '@data/rarities';
import { isDiscovered } from '@core/systems/dex';
import { getSpecies } from '@core/systems/creatures';
import { anyMutationChance, mutationOdds, speciesOdds } from '@core/systems/odds';
import { incubationDuration } from '@core/systems/incubation';
import { formatDuration, isNight } from '@core/time';
import { CreatureArt } from '../art/CreatureArt';
import { EggArt } from '../art/EggArt';
import { Icon } from '../art/Icons';
import { RarityBadge } from '../components/Badges';
import { useGame } from '../../store/gameStore';
import { tr } from '../../i18n';

export function formatPct(p: number): string {
  if (p === 0) return '0 %';
  if (p >= 0.1) return `${(p * 100).toFixed(1)} %`;
  if (p >= 0.01) return `${(p * 100).toFixed(2)} %`;
  return `${(p * 100).toFixed(3)} %`;
}

/** Affichage transparent des probabilités : calculées par la même fonction que le tirage réel. */
export function OddsModal({ eggType }: { eggType: string }) {
  const egg = EGGS[eggType]!;
  if (egg.genetic) return <GeneticEggInfo eggType={eggType} />;
  return <TableOdds eggType={eggType} />;
}

function GeneticEggInfo({ eggType }: { eggType: string }) {
  const egg = EGGS[eggType]!;
  return (
    <div className="stack">
      <div className="row" style={{ gap: 14 }}>
        <EggArt type={eggType} size={64} />
        <div><b style={{ fontSize: 18 }}>{egg.name}</b><p className="soft" style={{ fontSize: 13 }}>{egg.description}</p></div>
      </div>
      <div className="status-panel"><Icon name="flask" /><p style={{ fontSize: 13 }}>{tr('Le contenu de cet œuf a été déterminé lors de la fusion, selon les probabilités affichées au Laboratoire avant validation : espèce, gènes et mutations héritées. L\'ambiance de l\'incubateur peut encore ajouter une mutation dans un groupe resté libre.')}</p></div>
    </div>
  );
}

function TableOdds({ eggType }: { eggType: string }) {
  const state = useGame((s) => s.state);
  const egg = EGGS[eggType]!;
  const [amb, setAmb] = useState<string>(egg.requiresAmbiance?.[0] ?? 'neutre');
  const [night, setNight] = useState(isNight(new Date().getHours()));
  const odds = speciesOdds(eggType);
  const muts = mutationOdds(eggType, amb, night).filter((m) => m.probability > 0).sort((a, b) => b.probability - a.probability);
  const byRarity = RARITY_ORDER.map((r) => ({ r, p: odds.filter((o) => getSpecies(o.speciesId).rarity === r).reduce((s, o) => s + o.probability, 0) })).filter((x) => x.p > 0);

  return (
    <div className="stack">
      <div className="row" style={{ gap: 14 }}>
        <EggArt type={eggType} size={64} />
        <div>
          <div className="row-wrap"><b style={{ fontSize: 18 }}>{egg.name}</b><RarityBadge rarity={egg.rarity} small /></div>
          <p className="soft" style={{ fontSize: 13 }}>{egg.description}</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{tr('Incubation :')} {formatDuration(egg.incubationMs)}{egg.affinity.length > 0 && tr(' (−25 % en {p0})', { p0: egg.affinity.map((a) => AMBIANCES[a]!.name).join(' / ') })}</p>
        </div>
      </div>

      <div className="status-panel"><Icon name="info" /><p style={{ fontSize: 13 }}>{tr('Ces probabilités sont')} <b>exactes</b> {tr(': elles sont calculées par le même code que l\'éclosion réelle. Les espèces non découvertes restent masquées, mais leur chance est affichée.')}</p></div>

      <div className="rarity-strip">
        {byRarity.map(({ r, p }) => <div key={r} style={{ flex: p, ['--rc' as string]: RARITIES[r].color } as CSSProperties} className="tip" data-tip={`${RARITIES[r].name} : ${formatPct(p)}`} />)}
      </div>

      <div className="odds-table">
        {odds.map((o) => {
          const sp = getSpecies(o.speciesId);
          const known = isDiscovered(state, o.speciesId);
          return (
            <div key={o.speciesId} className="odds-row">
              <CreatureArt speciesId={o.speciesId} size={40} anim="none" silhouette={!known} />
              <span style={{ flex: 1, fontWeight: 800 }}>{known ? sp.name : '???'}</span>
              <RarityBadge rarity={sp.rarity} small />
              <b className="num odds-pct">{formatPct(o.probability)}</b>
            </div>
          );
        })}
      </div>

      <h3 style={{ fontSize: 16, marginTop: 8 }}>{tr('Chances de mutation')}</h3>
      <div className="row-wrap">
        <select className="select" value={amb} onChange={(e) => setAmb(e.target.value)} aria-label={tr('Ambiance simulée')}>
          {Object.values(AMBIANCES).map((a) => <option key={a.id} value={a.id}>{a.name}{state.unlocks.ambiances.includes(a.id) ? '' : tr(' (non débloquée)')}</option>)}
        </select>
        <button className={`chip ${night ? 'active' : ''}`} onClick={() => setNight(!night)}><Icon name={night ? 'moon' : 'sun'} />{night ? tr('Nuit') : tr('Jour')}</button>
        <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{tr('Durée :')} {formatDuration(incubationDuration(eggType, amb))}</span>
      </div>
      <p className="soft" style={{ fontSize: 13 }}>{tr('Au moins une mutation :')} <b>{formatPct(anyMutationChance(eggType, amb, night))}</b>{tr('. Les mutations d\'un même groupe sont incompatibles ; plusieurs groupes peuvent se cumuler.')}</p>
      <div className="odds-table compact">
        {muts.map((m) => (
          <div key={m.mutationId} className="odds-row">
            <i className="amb-dot" style={{ background: MUTATIONS[m.mutationId]!.color }} />
            <span style={{ flex: 1, fontWeight: 700 }}>{MUTATIONS[m.mutationId]!.name}</span>
            <b className="num odds-pct">{formatPct(m.probability)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
