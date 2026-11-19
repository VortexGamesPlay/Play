import { useRef, useState } from 'react';
import { SPECIES_LIST } from '@data/species';
import { dexCount, variantCount } from '@core/systems/dex';
import { Icon } from '../art/Icons';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { fmtDate, fmtDateTime } from '../format';

export function ProfileScreen() {
  const state = useGame((s) => s.state);
  const { dispatch, saveNow, exportSave, importSave, resetGame } = useGame.getState();
  const lastSavedAt = useGame((s) => s.lastSavedAt);
  const saveStatus = useGame((s) => s.saveStatus);
  const { openModal, toast } = useUi.getState();
  const [name, setName] = useState(state.player.name);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const blob = new Blob([exportSave()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eggverse-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ kind: 'success', title: 'Sauvegarde exportée', body: 'Garde ce fichier pour transférer ta partie.' });
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    openModal({
      kind: 'confirm', danger: true, title: 'Importer cette sauvegarde ?', confirmLabel: 'Importer',
      body: 'Ta progression actuelle sera remplacée par celle du fichier. Pense à exporter ta partie actuelle avant.',
      onConfirm: () => {
        try { importSave(text); toast({ kind: 'success', title: 'Sauvegarde importée' }); }
        catch (e) { toast({ kind: 'error', title: 'Import impossible', body: (e as Error).message }); }
      },
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const stats: [string, string | number][] = [
    ['Espèces découvertes', `${dexCount(state)}/${SPECIES_LIST.length}`], ['Variantes', variantCount(state)], ['Créatures', state.creatures.length],
    ['Œufs éclos', state.stats.eggsHatched], ['Œufs obtenus', state.stats.eggsObtained], ['Repas donnés', state.stats.creaturesFed],
    ['Niveaux gagnés', state.stats.levelUps], ['Récoltes', state.stats.harvests], ['Pièces récoltées', state.stats.coinsHarvested.toLocaleString('fr-FR')],
    ['Achats', state.stats.purchases], ['Connexions quotidiennes', state.stats.dailyClaims], ['Quêtes terminées', state.quests.claimed.length],
  ];

  return (
    <div className="profile-grid">
      <div className="card">
        <div className="card-title"><Icon name="people" /><h2>Profil du gardien</h2></div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'setPlayerName', name }); }}>
          <div className="field" style={{ flex: 1 }}><Icon name="edit" /><input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} aria-label="Nom du gardien" /></div>
          <button className="btn btn-sm" type="submit" disabled={name.trim() === state.player.name || !name.trim()}>Enregistrer</button>
        </form>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Gardien depuis le {fmtDate(state.player.createdAt)}</p>
        <div className="stat-tiles">{stats.map(([l, v]) => <div key={l}><b className="num">{v}</b><span>{l}</span></div>)}</div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card-title"><Icon name="gear" /><h2>Paramètres</h2></div>
          <div className="setting"><Icon name="volume" /><div><b>Effets sonores</b><span>Sons d'interface et d'éclosion</span></div>
            <button className={`toggle ${state.settings.sound ? 'on' : ''}`} aria-pressed={state.settings.sound} aria-label="Effets sonores" onClick={() => dispatch({ type: 'setSetting', key: 'sound', value: !state.settings.sound })} /></div>
          <div className="setting"><Icon name="motion" /><div><b>Animations réduites</b><span>Limite les mouvements à l'écran</span></div>
            <button className={`toggle ${state.settings.reducedMotion ? 'on' : ''}`} aria-pressed={state.settings.reducedMotion} aria-label="Animations réduites" onClick={() => dispatch({ type: 'setSetting', key: 'reducedMotion', value: !state.settings.reducedMotion })} /></div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Musiques d'ambiance par biome : Phase 8.</p>
        </div>

        <div className="card">
          <div className="card-title"><Icon name="save" /><h2>Sauvegarde</h2></div>
          <p className="soft" style={{ fontSize: 14 }}>Sauvegarde automatique sur cet appareil après chaque action, avec copie de secours.
            {' '}<b>{saveStatus === 'pending' ? 'Enregistrement…' : saveStatus === 'error' ? 'Échec du dernier enregistrement' : lastSavedAt ? `Dernière sauvegarde : ${fmtDateTime(lastSavedAt)}` : ''}</b></p>
          <div className="row-wrap" style={{ marginTop: 12 }}>
            <button className="btn btn-sm" onClick={() => void saveNow().then(() => toast({ kind: 'success', title: 'Partie sauvegardée' }))}><Icon name="save" />Sauvegarder</button>
            <button className="btn btn-ghost btn-sm" onClick={doExport}><Icon name="download" />Exporter</button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Icon name="upload" />Importer</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
          </div>
          <div className="status-panel" style={{ marginTop: 12 }}><Icon name="info" /><p style={{ fontSize: 13 }}><b>Synchronisation entre appareils : Phase 6</b> (comptes en ligne). En attendant, l'export / import permet de transférer ta partie.</p></div>
          <button className="btn btn-danger btn-sm" style={{ marginTop: 12 }} onClick={() => openModal({
            kind: 'confirm', danger: true, title: 'Recommencer à zéro ?', confirmLabel: 'Tout effacer',
            body: 'Toutes tes créatures, œufs et ressources seront définitivement supprimés de cet appareil.',
            onConfirm: () => void resetGame().then(() => toast({ kind: 'info', title: 'Nouvelle partie', body: 'Bienvenue, gardien !' })),
          })}><Icon name="trash" />Réinitialiser la partie</button>
        </div>
        <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>EGGVERSE v{__APP_VERSION__} · Phases 1 et 2</p>
      </div>
    </div>
  );
}
