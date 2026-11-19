import { getSpecies } from '@core/systems/creatures';
import { SPECIES } from '@data/species';
import { Modal } from './components/Modal';
import { ConfirmModal } from './modals/ConfirmModal';
import { CreatureDetail } from './modals/CreatureDetail';
import { DexDetail } from './modals/DexDetail';
import { FeedModal } from './modals/FeedModal';
import { HatchSequence } from './modals/HatchSequence';
import { EvolutionSequence } from './modals/EvolutionSequence';
import { BreedFx, ParentPickerModal } from './screens/LabScreen';
import { OddsModal } from './modals/OddsModal';
import { EggPickerModal } from './screens/IncubatorScreen';
import { useGame } from '../store/gameStore';
import { useUi, type Modal as M } from '../store/uiStore';
import { isDiscovered } from '@core/systems/dex';

function Render({ m }: { m: M }) {
  const state = useGame((s) => s.state);
  switch (m.kind) {
    case 'hatch': return <HatchSequence event={m.event} />;
    case 'evolve': return <EvolutionSequence event={m.event} />;
    case 'breedFx': return <BreedFx parents={m.parents} eggUid={m.eggUid} />;
    case 'parentPicker': return <Modal title="Choisir un parent" width={560}><ParentPickerModal exclude={m.exclude} onPick={m.onPick} /></Modal>;
    case 'creature': return <Modal title="Fiche créature" width={620}><CreatureDetail uid={m.uid} /></Modal>;
    case 'dex': return <Modal title={isDiscovered(state, m.speciesId) ? `Ovidex — ${SPECIES[m.speciesId]?.name}` : 'Ovidex — ???'} width={600}><DexDetail speciesId={m.speciesId} /></Modal>;
    case 'eggPicker': return <Modal title={`Incubateur ${m.slot + 1} — choisir un œuf`} width={600}><EggPickerModal slot={m.slot} /></Modal>;
    case 'odds': return <Modal title="Probabilités" width={560}><OddsModal eggType={m.eggType} /></Modal>;
    case 'feed': return <Modal title={m.uid ? `Nourrir ${(() => { const c = state.creatures.find((x) => x.uid === m.uid); return c ? c.nickname || getSpecies(c.speciesId).name : ''; })()}` : 'Nourrir une créature'} width={520}><FeedModal uid={m.uid} item={m.item} /></Modal>;
    case 'confirm': return <Modal title={m.title} width={440}><ConfirmModal body={m.body} confirmLabel={m.confirmLabel} danger={m.danger} onConfirm={m.onConfirm} /></Modal>;
  }
}

export function ModalHost() {
  const modals = useUi((s) => s.modals);
  // Seule la modale du dessus est affichée : la navigation reste lisible sur mobile.
  const top = modals[modals.length - 1];
  if (!top) return null;
  return <Render key={modals.length} m={top} />;
}
