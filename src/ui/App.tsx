import { useEffect } from 'react';
import { useGame } from '../store/gameStore';
import { useUi } from '../store/uiStore';
import { AppShell } from './layout/AppShell';
import { ModalHost } from './ModalHost';
import { Toasts } from './components/Toasts';
import { SanctuaryScreen } from './screens/SanctuaryScreen';
import { IncubatorScreen } from './screens/IncubatorScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { DexScreen } from './screens/DexScreen';
import { ShopScreen } from './screens/ShopScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ComingSoonScreen } from './screens/ComingSoonScreen';
import { LabScreen } from './screens/LabScreen';
import { ExplorationScreen } from './screens/ExplorationScreen';
import { ArenaScreen } from './screens/ArenaScreen';
import { SeasonScreen } from './premium/SeasonScreen';
import { useEggReadyChime, useMusic } from './hooks/useMusic';

function Music() {
  useMusic();
  useEggReadyChime();
  return null;
}

function Screen() {
  const route = useUi((s) => s.route);
  switch (route) {
    case 'sanctuaire': return <SanctuaryScreen />;
    case 'incubateur': return <IncubatorScreen />;
    case 'collection': return <CollectionScreen />;
    case 'bestiaire': return <DexScreen />;
    case 'boutique': return <ShopScreen />;
    case 'inventaire': return <InventoryScreen />;
    case 'profil': return <ProfileScreen />;
    case 'laboratoire': return <LabScreen />;
    case 'exploration': return <ExplorationScreen />;
    case 'arene': return <ArenaScreen />;
    case 'saison': return <SeasonScreen />;
    case 'communaute': return <ComingSoonScreen route={route} />;
  }
}

export function App() {
  const ready = useGame((s) => s.ready);
  const init = useGame((s) => s.init);
  useEffect(() => {
    void init().then(() => import('./premium/restore').then((m) => m.restorePurchases()).catch(() => { /* hors ligne : réessayé plus tard */ }));
  }, [init]);
  if (!ready) {
    return <div className="boot"><div className="boot-egg" /><p>Chargement du sanctuaire…</p></div>;
  }
  return (
    <>
      <Music />
      <AppShell><Screen /></AppShell>
      <ModalHost />
      <Toasts />
    </>
  );
}
