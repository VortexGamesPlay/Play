import { useRef, useState } from 'react';
import { SPECIES_LIST } from '@data/species';
import { dexCount, variantCount } from '@core/systems/dex';
import { ACHIEVEMENTS } from '@data/missions';
import { questProgress } from '@core/systems/quests';
import { Bar } from '../components/Bar';
import { PRODUCT_BY_ID, formatPrice } from '@data/products';
import { spentThisMonth } from '@core/systems/premium';
import { paymentsConfig } from '../../services/payments';
import { restorePurchases } from '../premium/restore';
import { Icon } from '../art/Icons';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { fmtDate, fmtDateTime } from '../format';
import { tr, intlLocale, LOCALES } from '../../i18n';

export function ProfileScreen() {
  const state = useGame((s) => s.state);
  const { dispatch, saveNow, exportSave, importSave, resetGame } = useGame.getState();
  const lastSavedAt = useGame((s) => s.lastSavedAt);
  const saveStatus = useGame((s) => s.saveStatus);
  const { openModal, toast } = useUi.getState();
  const [name, setName] = useState(state.player.name);
  const fileRef = useRef<HTMLInputElement>(null);
  const restore = async () => {
    try { const n = await restorePurchases(); toast({ kind: 'success', title: tr('Achats vérifiés'), body: n ? tr('{n} achat(s) récupéré(s).', { n }) : tr('Tous tes achats sont déjà crédités.') }); }
    catch (e) { toast({ kind: 'error', title: tr('Restauration impossible'), body: (e as Error).message }); }
  };

  const doExport = () => {
    const blob = new Blob([exportSave()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eggverse-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ kind: 'success', title: tr('Sauvegarde exportée'), body: tr('Garde ce fichier pour transférer ta partie.') });
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    openModal({
      kind: 'confirm', danger: true, title: tr('Importer cette sauvegarde ?'), confirmLabel: tr('Importer'),
      body: tr('Ta progression actuelle sera remplacée par celle du fichier. Pense à exporter ta partie actuelle avant.'),
      onConfirm: () => {
        try { importSave(text); toast({ kind: 'success', title: tr('Sauvegarde importée') }); }
        catch (e) { toast({ kind: 'error', title: tr('Import impossible'), body: (e as Error).message }); }
      },
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const stats: [string, string | number][] = [
    [tr('Espèces découvertes'), `${dexCount(state)}/${SPECIES_LIST.length}`], [tr('Variantes'), variantCount(state)], [tr('Créatures'), state.creatures.length],
    [tr('Œufs éclos'), state.stats.eggsHatched], [tr('Œufs obtenus'), state.stats.eggsObtained], [tr('Repas donnés'), state.stats.creaturesFed],
    [tr('Niveaux gagnés'), state.stats.levelUps], [tr('Récoltes'), state.stats.harvests], [tr('Pièces récoltées'), state.stats.coinsHarvested.toLocaleString(intlLocale())],
    [tr('Achats'), state.stats.purchases], [tr('Expéditions'), state.stats.expeditions], [tr('Zones secrètes'), state.exploration.secretsFound.length], [tr('Connexions quotidiennes'), state.stats.dailyClaims], [tr('Quêtes terminées'), state.quests.claimed.length],
  ];

  return (
    <div className="profile-grid">
      <div className="card">
        <div className="card-title"><Icon name="people" /><h2>{tr('Profil du gardien')}</h2></div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); dispatch({ type: 'setPlayerName', name }); }}>
          <div className="field" style={{ flex: 1 }}><Icon name="edit" /><input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} aria-label={tr('Nom du gardien')} /></div>
          <button className="btn btn-sm" type="submit" disabled={name.trim() === state.player.name || !name.trim()}>{tr('Enregistrer')}</button>
        </form>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{tr('Gardien depuis le')} {fmtDate(state.player.createdAt)}</p>
        <div className="stat-tiles">{stats.map(([l, v]) => <div key={l}><b className="num">{v}</b><span>{l}</span></div>)}</div>

        <div className="card-title" style={{ marginTop: 22 }}><Icon name="trophy" /><h2>{tr('Trophées')}</h2><span className="spacer" /><span className="badge soft-badge">{state.achievements.length}/{ACHIEVEMENTS.length}</span></div>
        <div className="trophies">
          {ACHIEVEMENTS.map((a) => {
            const p = questProgress(state, { ...a, chapter: '' });
            const got = state.achievements.includes(a.id);
            return (
              <div key={a.id} className={`trophy ${got ? 'got' : p.done ? 'ready' : ''}`}>
                <span className="trophy-ic"><Icon name="trophy" /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{a.title}</b><div className="muted" style={{ fontSize: 12 }}>{a.description}</div>
                  {!got && <Bar value={p.current / p.target} size="thin" />}
                </div>
                {got ? <Icon name="check" style={{ color: 'var(--mint)', width: 20 }} /> : <button className="btn btn-gold btn-sm" disabled={!p.done} onClick={() => dispatch({ type: 'claimAchievement', id: a.id })}>{p.done ? tr('Obtenir') : `${p.current}/${p.target}`}</button>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card-title"><Icon name="gear" /><h2>{tr('Paramètres')}</h2></div>
          <div className="setting"><Icon name="compass" /><div><b>{tr('Language · Langue')}</b><span>{tr('Langue du jeu')}</span></div>
            <div className="tabs small" role="radiogroup" aria-label={tr('Language')}>
              {LOCALES.map((l) => <button key={l.id} role="radio" aria-checked={state.settings.locale === l.id} className={state.settings.locale === l.id ? 'active' : ''} onClick={() => dispatch({ type: 'setLocale', locale: l.id })}>{l.label}</button>)}
            </div></div>
          <div className="setting"><Icon name="volume" /><div><b>{tr('Son')}</b><span>{tr('Musique et effets sonores')}</span></div>
            <button className={`toggle ${state.settings.sound ? 'on' : ''}`} aria-pressed={state.settings.sound} aria-label={tr('Son')} onClick={() => dispatch({ type: 'setSetting', key: 'sound', value: !state.settings.sound })} /></div>
          <div className="setting"><Icon name="motion" /><div><b>{tr('Animations réduites')}</b><span>{tr('Limite les mouvements à l\'écran')}</span></div>
            <button className={`toggle ${state.settings.reducedMotion ? 'on' : ''}`} aria-pressed={state.settings.reducedMotion} aria-label={tr('Animations réduites')} onClick={() => dispatch({ type: 'setSetting', key: 'reducedMotion', value: !state.settings.reducedMotion })} /></div>
          <div className="setting"><Icon name="volume" /><div><b>{tr('Musique')}</b><span>{tr('Bande originale d\'EGGVERSE')}</span></div>
            <input id="music-volume" type="range" className="range" min={0} max={100} step={5} value={Math.round(state.settings.musicVolume * 100)} disabled={!state.settings.sound} aria-label={tr('Volume de la musique')} onChange={(e) => dispatch({ type: 'setVolume', key: 'musicVolume', value: Number(e.target.value) / 100 })} /></div>
          <div className="setting"><Icon name="volume" /><div><b>{tr('Volume des effets')}</b><span>{tr('Clics, récompenses, jingles')}</span></div>
            <input id="sfx-volume" type="range" className="range" min={0} max={100} step={5} value={Math.round(state.settings.sfxVolume * 100)} disabled={!state.settings.sound} aria-label={tr('Volume des effets sonores')} onChange={(e) => dispatch({ type: 'setVolume', key: 'sfxVolume', value: Number(e.target.value) / 100 })} /></div>
        </div>

        <div className="card">
          <div className="card-title"><Icon name="gift" /><h2>{tr('Achats')}</h2></div>
          <div className="setting"><Icon name="lock" /><div><b>{tr('Limite de dépenses mensuelle')}</b><span>{tr('Dépensé ce mois-ci :')} {formatPrice(spentThisMonth(state, Date.now()))}</span></div>
            <select id="spend-limit" className="select" value={state.premium.spendLimitCents ?? ''} onChange={(e) => dispatch({ type: 'setSpendLimit', cents: e.target.value === '' ? null : Number(e.target.value) })} aria-label={tr('Limite de dépenses mensuelle')}>
              <option value="">{tr('Aucune')}</option><option value="0">{tr('Bloquer les achats')}</option><option value="1000">10 €</option><option value="2000">20 €</option><option value="5000">50 €</option><option value="10000">100 €</option>
            </select>
          </div>
          {state.premium.purchases.length === 0 ? <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{tr('Aucun achat pour l\'instant.')}</p> : (
            <div className="ledger" style={{ padding: 0, marginTop: 8 }}>
              {[...state.premium.purchases].reverse().map((p) => (
                <div key={p.orderId} className="ledger-row">
                  <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 14 }}>{PRODUCT_BY_ID[p.productId]?.name ?? p.productId}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDateTime(p.at)} · {p.provider === 'test' ? tr('mode test') : p.provider === 'paypal' ? tr('PayPal') : tr('magasin d\'applications')} {tr('· n°')} {p.orderId}</div></div>
                  <b className="num">{formatPrice(p.amountCents)}</b>
                </div>
              ))}
            </div>
          )}
          {paymentsConfig.paypal && <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => void restore()}><Icon name="download" />{tr('Restaurer mes achats')}</button>}
        </div>

        <div className="card">
          <div className="card-title"><Icon name="save" /><h2>{tr('Sauvegarde')}</h2></div>
          <p className="soft" style={{ fontSize: 14 }}>{tr('Sauvegarde automatique sur cet appareil après chaque action, avec copie de secours.')}
            {' '}<b>{saveStatus === 'pending' ? tr('Enregistrement…') : saveStatus === 'error' ? tr('Échec du dernier enregistrement') : lastSavedAt ? tr('Dernière sauvegarde : {p0}', { p0: fmtDateTime(lastSavedAt) }) : ''}</b></p>
          <div className="row-wrap" style={{ marginTop: 12 }}>
            <button className="btn btn-sm" onClick={() => void saveNow().then(() => toast({ kind: 'success', title: tr('Partie sauvegardée') }))}><Icon name="save" />{tr('Sauvegarder')}</button>
            <button className="btn btn-ghost btn-sm" onClick={doExport}><Icon name="download" />{tr('Exporter')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Icon name="upload" />{tr('Importer')}</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onImport(e.target.files?.[0])} />
          </div>
          <div className="status-panel" style={{ marginTop: 12 }}><Icon name="info" /><p style={{ fontSize: 13 }}><b>{tr('Synchronisation entre appareils : Phase 6')}</b> {tr('(comptes en ligne). En attendant, l\'export / import permet de transférer ta partie.')}</p></div>
          <button className="btn btn-danger btn-sm" style={{ marginTop: 12 }} onClick={() => openModal({
            kind: 'confirm', danger: true, title: tr('Recommencer à zéro ?'), confirmLabel: tr('Tout effacer'),
            body: tr('Toutes tes créatures, œufs et ressources seront définitivement supprimés de cet appareil.'),
            onConfirm: () => void resetGame().then(() => toast({ kind: 'info', title: tr('Nouvelle partie'), body: tr('Bienvenue, gardien !') })),
          })}><Icon name="trash" />{tr('Réinitialiser la partie')}</button>
        </div>
        <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>{tr('EGGVERSE v')}{__APP_VERSION__} {tr('· Phases 1 et 2')}</p>
      </div>
    </div>
  );
}
