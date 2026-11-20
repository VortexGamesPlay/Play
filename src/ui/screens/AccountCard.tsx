import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '../art/Icons';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { fmtDateTime } from '../format';
import { tr } from '../../i18n';
import { currentAccount, serverAvailable, type AccountInfo } from '../../services/supabase';
import { requestCode, signOut, verifyCode, type CodeMode } from '../../services/account';
import { cloudStatus, onCloudStatus, uploadNow } from '../../services/cloudSave';

/** Compte en ligne : sauvegarde dans le cloud et connexion par e-mail (code à 6 chiffres, sans mot de passe). */
export function AccountCard() {
  const toast = useUi((s) => s.toast);
  const state = useGame((s) => s.state);
  const syncWithCloud = useGame((s) => s.syncWithCloud);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [status, setStatus] = useState(cloudStatus());
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<CodeMode | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => void currentAccount().then(setAccount).catch(() => setAccount(null));
  useEffect(() => { refresh(); return onCloudStatus(() => setStatus(cloudStatus())); }, []);

  if (!serverAvailable()) return null;

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    try { await f(); } catch (e) { toast({ kind: 'error', title: tr('Compte'), body: (e as Error).message }); } finally { setBusy(false); }
  };

  const onRequest = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const m = await requestCode(email);
    setMode(m);
    toast({ kind: 'info', title: tr('Code envoyé'), body: tr('Regarde ta boîte mail (et les indésirables) : un code à 6 chiffres t\'attend.') });
  }); };

  const onVerify = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    await verifyCode(email, code, mode!);
    setMode(null); setCode('');
    refresh();
    toast({ kind: 'success', title: tr('Compte relié !'), body: tr('Ta partie est maintenant sauvegardée sur ton compte.') });
    // Connexion à un compte existant : on compare avec la partie de ce compte.
    if (mode === 'login') await syncWithCloud({ afterLogin: true }); else await uploadNow(state);
  }); };

  const onSignOut = () => void run(async () => {
    await uploadNow(state).catch(() => {});
    await signOut();
    refresh();
    toast({ kind: 'info', title: tr('Déconnecté'), body: tr('La partie reste sur cet appareil. Reconnecte-toi pour la retrouver ailleurs.') });
  });

  return (
    <div className="card">
      <div className="card-title"><Icon name="people" /><h2>{tr('Compte en ligne')}</h2></div>
      <p className="soft" style={{ fontSize: 14 }}>
        {account?.email ? <>{tr('Connecté avec')} <b>{account.email}</b>.</> : tr('Tu joues avec un compte invité, lié à cet appareil. Relie ton e-mail pour ne jamais perdre ta partie et la retrouver sur un autre téléphone ou ordinateur.')}
      </p>
      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        <Icon name="cloud" width={14} height={14} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
        {status.uploading ? tr('Envoi en cours…') : status.lastUploadedAt ? tr('Sauvegardé en ligne : {date}', { date: fmtDateTime(status.lastUploadedAt) }) : status.error ? tr('Hors ligne : la partie sera envoyée dès que possible.') : tr('Sauvegarde en ligne automatique.')}
      </p>

      {!account?.email && (
        mode ? (
          <form className="row-wrap" style={{ marginTop: 12 }} onSubmit={onVerify}>
            <div className="field" style={{ flex: '1 1 160px' }}><Icon name="lock" /><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder={tr('Code à 6 chiffres')} aria-label={tr('Code reçu par e-mail')} /></div>
            <button className="btn btn-sm" type="submit" disabled={busy || code.length < 6}>{tr('Valider')}</button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setMode(null); setCode(''); }}>{tr('Changer d\'e-mail')}</button>
          </form>
        ) : (
          <form className="row-wrap" style={{ marginTop: 12 }} onSubmit={onRequest}>
            <div className="field" style={{ flex: '1 1 200px' }}><Icon name="edit" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={tr('ton@email.com')} aria-label={tr('Adresse e-mail')} /></div>
            <button className="btn btn-sm" type="submit" disabled={busy || !email.includes('@')}>{tr('Recevoir un code')}</button>
          </form>
        )
      )}
      {account?.email && (
        <div className="row-wrap" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(async () => { await uploadNow(state); toast({ kind: 'success', title: tr('Partie envoyée sur ton compte') }); })}><Icon name="upload" />{tr('Sauvegarder en ligne')}</button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={onSignOut}>{tr('Se déconnecter')}</button>
        </div>
      )}
    </div>
  );
}
