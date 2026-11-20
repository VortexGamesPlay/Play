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
import { BiomeModal, ExpeditionModal, ExpeditionResult } from './screens/ExplorationScreen';
import { BIOME_BY_ID } from '@data/biomes';
import { BattleView } from './battle/BattleView';
import { CheckoutModal } from './premium/PremiumShop';
import { ElementGuideModal, TeamPickerModal } from './screens/ArenaScreen';
import { OddsModal } from './modals/OddsModal';
import { EggPickerModal } from './screens/IncubatorScreen';
import { useGame } from '../store/gameStore';
import { useUi, type Modal as M } from '../store/uiStore';
import { isDiscovered } from '@core/systems/dex';
import { tr } from '../i18n';

function Render({ m }: { m: M }) {
  const state = useGame((s) => s.state);
  switch (m.kind) {
    case 'hatch': return <HatchSequence event={m.event} />;
    case 'biome': return <Modal title={BIOME_BY_ID[m.biomeId]?.name} width={820}><BiomeModal biomeId={m.biomeId} /></Modal>;
    case 'expedition': return <Modal title={tr('Expédition : {name}', { name: BIOME_BY_ID[m.biomeId]?.name })} width={720}><ExpeditionModal biomeId={m.biomeId} /></Modal>;
    case 'expeditionResult': return <Modal title={tr('Retour d\'expédition')} width={560}><ExpeditionResult event={m.event} /></Modal>;
    case 'battle': return <BattleView />;
    case 'checkout': return <Modal title={tr('Paiement')} width={520}><CheckoutModal productId={m.productId} /></Modal>;
    case 'teamPicker': return <Modal title={tr('Équipe de combat')} width={680}><TeamPickerModal /></Modal>;
    case 'elementGuide': return <Modal title={tr('Guide des éléments')} width={640}><ElementGuideModal /></Modal>;
    case 'evolve': return <EvolutionSequence event={m.event} />;
    case 'breedFx': return <BreedFx parents={m.parents} eggUid={m.eggUid} />;
    case 'parentPicker': return <Modal title={tr('Choisir un parent')} width={560}><ParentPickerModal exclude={m.exclude} onPick={m.onPick} /></Modal>;
    case 'creature': return <Modal title={tr('Fiche créature')} width={620}><CreatureDetail uid={m.uid} /></Modal>;
    case 'dex': return <Modal title={isDiscovered(state, m.speciesId) ? tr('Bestiaire — {name}', { name: SPECIES[m.speciesId]?.name }) : tr('Bestiaire — ???')} width={600}><DexDetail speciesId={m.speciesId} /></Modal>;
    case 'eggPicker': return <Modal title={tr('Incubateur {p0} — choisir un œuf', { p0: m.slot + 1 })} width={600}><EggPickerModal slot={m.slot} /></Modal>;
    case 'odds': return <Modal title={tr('Probabilités')} width={560}><OddsModal eggType={m.eggType} /></Modal>;
    case 'feed': return <Modal title={m.uid ? tr('Nourrir {p0}', { p0: (() => { const c = state.creatures.find((x) => x.uid === m.uid); return c ? c.nickname || getSpecies(c.speciesId).name : ''; })() }) : tr('Nourrir une créature')} width={520}><FeedModal uid={m.uid} item={m.item} /></Modal>;
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
