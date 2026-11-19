import type { CSSProperties } from 'react';
import type { CreatureInstance } from '@core/types';
import { displayName, getSpecies } from '@core/systems/creatures';
import { RARITIES } from '@data/rarities';
import { ELEMENTS } from '@data/elements';
import { CreatureArt } from '../art/CreatureArt';
import { ElementIcon, Icon } from '../art/Icons';
import { MUTATIONS } from '@data/mutations';

export function CreatureCard({ c, onClick, selected, evolvable }: { c: CreatureInstance; onClick?: () => void; selected?: boolean; evolvable?: boolean }) {
  const sp = getSpecies(c.speciesId);
  const r = RARITIES[sp.rarity];
  return (
    <button className={`cr-card t${r.tier} ${selected ? 'selected' : ''} ${c.mutations.length ? 'mutated' : ''}`} onClick={onClick} style={{ ['--rc' as string]: r.color, ['--rg' as string]: r.glow } as CSSProperties}>
      <div className="cr-card-top">
        <span className="cr-lvl num">Nv {c.level}</span>
        {c.favorite && <Icon name="heartFill" className="cr-fav" />}
        <span className="cr-el tip" data-tip={ELEMENTS[sp.element].name}><ElementIcon element={sp.element} style={{ color: ELEMENTS[sp.element].color }} /></span>
      </div>
      {evolvable && <span className="cr-evo tip" data-tip="Évolution possible"><Icon name="sparkle" /></span>}
      <div className="cr-card-art"><CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.genes.hue} size={112} seed={c.uid} /></div>
      <div className="cr-card-name">{displayName(c)}</div>
      <div className="cr-card-sub">
        <span className="rar-dot" />{r.name}
        {c.mutations.length > 0 && <span className="mut-dots">{c.mutations.map((m) => <i key={m} style={{ background: MUTATIONS[m]?.color }} />)}</span>}
      </div>
    </button>
  );
}
