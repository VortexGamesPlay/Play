import type { CSSProperties } from 'react';
import type { ElementId, RarityId } from '@core/types';
import { ELEMENTS } from '@data/elements';
import { MUTATIONS } from '@data/mutations';
import { RARITIES } from '@data/rarities';
import { ElementIcon, Icon } from '../art/Icons';

export function RarityBadge({ rarity, small }: { rarity: RarityId; small?: boolean }) {
  const r = RARITIES[rarity];
  return (
    <span className={`badge rarity-badge t${r.tier}`} style={{ ['--rc' as string]: r.color, ...(small ? { fontSize: 11, padding: '2px 8px' } : {}) } as CSSProperties}>
      {r.tier >= 4 && <Icon name="starFill" />}{r.name}
    </span>
  );
}

export function ElementBadge({ element }: { element: ElementId }) {
  const e = ELEMENTS[element];
  return (
    <span className="badge element-badge" style={{ ['--ec' as string]: e.color } as CSSProperties}>
      <ElementIcon element={element} style={{ color: e.color }} />{e.name}
    </span>
  );
}

export function MutationBadge({ mutation, title }: { mutation: string; title?: string }) {
  const m = MUTATIONS[mutation];
  if (!m) return null;
  return (
    <span className="badge mutation-badge tip" data-tip={title ?? m.description.slice(0, 60)} style={{ ['--mc' as string]: m.color } as CSSProperties}>
      <Icon name="sparkle" />{m.name}
    </span>
  );
}
