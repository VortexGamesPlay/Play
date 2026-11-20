import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Icon } from '../art/Icons';
import { CreatureArt } from '../art/CreatureArt';
import { EmptyState } from '../components/EmptyState';
import { useGame } from '../../store/gameStore';
import { useUi } from '../../store/uiStore';
import { tr, tp } from '../../i18n';
import { serverAvailable } from '../../services/supabase';
import { addFriend, claimGifts, friendSanctuary, listFriends, myFriendCode, removeFriend, sendGift, type Friend, type FriendSanctuary } from '../../services/friends';
import { playSfx } from '../../services/audio';
import { fmtDateTime, keeperName } from '../format';
import { SanctuaryScene } from './SanctuaryScreen';
import type { CreatureInstance } from '@core/types';

const shownName = keeperName;

/** Communauté : code ami, liste d'amis, cadeaux quotidiens et visites de sanctuaires. */
export function CommunityScreen() {
  const toast = useUi((s) => s.toast);
  const openModal = useUi((s) => s.openModal);
  const closeModal = useUi((s) => s.closeModal);
  const dispatch = useGame((s) => s.dispatch);
  const [code, setCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [visit, setVisit] = useState<{ friend: Friend; data: FriendSanctuary | null } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([myFriendCode(), listFriends()]);
      setCode(c); setFriends(f); setOffline(false);
    } catch { setOffline(true); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    try { await f(); } catch (e) { toast({ kind: 'error', title: tr('Communauté'), body: (e as Error).message }); } finally { setBusy(false); }
  };

  const waiting = useMemo(() => (friends ?? []).filter((f) => f.gift_waiting).length, [friends]);

  if (!serverAvailable()) return <EmptyState icon="people" title={tr('Communauté indisponible')}>{tr('Cette version du jeu n\'est pas reliée au serveur.')}</EmptyState>;
  if (offline) return <EmptyState icon="people" title={tr('Hors ligne')}>{tr('Connecte-toi à Internet pour retrouver tes amis.')}</EmptyState>;

  const share = async () => {
    if (!code) return;
    const text = tr('Ajoute-moi dans EGGVERSE ! Mon code ami : {code}', { code });
    try {
      if (navigator.share) await navigator.share({ text, url: location.href.split('#')[0] });
      else { await navigator.clipboard.writeText(code); toast({ kind: 'success', title: tr('Code copié') }); }
    } catch { /* partage annulé */ }
  };

  const onAdd = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const name = await addFriend(input);
    setInput('');
    playSfx('claim');
    toast({ kind: 'success', title: tr('Nouvel ami !'), body: tr('{name} fait maintenant partie de tes amis.', { name: shownName(name) }) });
    await refresh();
  }); };

  const onClaim = () => void run(async () => {
    const n = await claimGifts();
    if (n > 0) dispatch({ type: 'claimFriendGifts', count: n });
    await refresh();
  });

  const onGift = (f: Friend) => void run(async () => {
    const sent = await sendGift(f.friend_id);
    if (sent) { playSfx('buy'); toast({ kind: 'success', title: tr('Cadeau envoyé'), body: tr('{name} le recevra à sa prochaine visite.', { name: shownName(f.name) }) }); }
    await refresh();
  });

  const onVisit = (f: Friend) => void run(async () => {
    const data = await friendSanctuary(f.friend_id);
    playSfx('open');
    setVisit({ friend: f, data });
  });

  const onRemove = (f: Friend) => openModal({
    kind: 'confirm', danger: true, title: tr('Retirer {name} ?', { name: shownName(f.name) }), confirmLabel: tr('Retirer'),
    body: tr('Vous ne serez plus amis. Vous pourrez vous ré-ajouter avec le code ami.'),
    onConfirm: () => { closeModal(); void run(async () => { await removeFriend(f.friend_id); await refresh(); }); },
  });

  if (visit) return <FriendVisit friend={visit.friend} data={visit.data} onBack={() => setVisit(null)} onGift={() => onGift(visit.friend)} />;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card community-hero">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{tr('Communauté')}</h2>
          <p className="soft" style={{ fontSize: 14 }}>{tr('Ajoute tes amis avec leur code, visite leur sanctuaire et envoyez-vous un cadeau chaque jour.')}</p>
        </div>
        <div className="friend-code">
          <span className="muted" style={{ fontSize: 12, fontWeight: 800 }}>{tr('Mon code ami')}</span>
          <b className="num">{code ?? '········'}</b>
          <button className="btn btn-sm" onClick={() => void share()} disabled={!code}><Icon name="upload" />{tr('Partager')}</button>
        </div>
      </div>

      <form className="card row-wrap" onSubmit={onAdd}>
        <div className="field" style={{ flex: '1 1 200px' }}><Icon name="plus" /><input value={input} onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} placeholder={tr('Code ami (8 caractères)')} aria-label={tr('Code ami')} /></div>
        <button className="btn btn-pink" type="submit" disabled={busy || input.length !== 8}><Icon name="people" />{tr('Ajouter')}</button>
      </form>

      {waiting > 0 && (
        <div className="card gift-banner">
          <Icon name="gift" width={34} height={34} />
          <div style={{ flex: 1 }}><b>{tp(waiting, '{n} cadeau t\'attend !', '{n} cadeaux t\'attendent !')}</b><div className="soft" style={{ fontSize: 13 }}>{tr('Chaque cadeau : 40 pièces et 1 Fruit rose.')}</div></div>
          <button className="btn btn-pink" onClick={onClaim} disabled={busy}><Icon name="gift" />{tr('Récupérer')}</button>
        </div>
      )}

      <div className="card">
        <div className="card-title"><Icon name="people" /><h3>{tr('Mes amis')}</h3><span className="badge soft-badge">{friends?.length ?? 0}</span></div>
        {friends === null ? <p className="muted">{tr('Chargement…')}</p> : friends.length === 0 ? (
          <p className="soft" style={{ fontSize: 14 }}>{tr('Tu n\'as pas encore d\'amis. Partage ton code ami pour commencer !')}</p>
        ) : (
          <div className="friend-list">
            {friends.map((f) => (
              <div key={f.friend_id} className="friend-row">
                <div className="friend-avatar"><Icon name="people" /></div>
                <div className="friend-info">
                  <b className="friend-name">{shownName(f.name)}</b>
                  <div className="muted" style={{ fontSize: 12 }}>{tr('{dex}/40 espèces · étage {tower} · {wins} victoires', { dex: f.dex, tower: f.tower, wins: f.wins })}{f.last_seen ? ` · ${tr('vu le {date}', { date: fmtDateTime(Date.parse(f.last_seen)) })}` : ''}</div>
                </div>
                <div className="friend-actions">
                  <button className="btn btn-sm" onClick={() => onVisit(f)} disabled={busy}><Icon name="sanctuary" />{tr('Visiter')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onGift(f)} disabled={busy || f.gift_sent_today} title={f.gift_sent_today ? tr('Déjà envoyé aujourd\'hui') : tr('Envoyer un cadeau')}><Icon name={f.gift_sent_today ? 'check' : 'gift'} />{f.gift_sent_today ? tr('Envoyé') : tr('Cadeau')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => onRemove(f)} disabled={busy} aria-label={tr('Retirer')}><Icon name="close" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendVisit({ friend, data, onBack, onGift }: { friend: Friend; data: FriendSanctuary | null; onBack: () => void; onGift: () => void }) {
  const creatures = useMemo(() => (data?.creatures ?? []).map((c) => ({
    uid: c.uid, speciesId: c.speciesId, mutations: c.mutations, genes: { hp: 0, atk: 0, def: 0, spd: 0, hue: c.hue }, nickname: c.nickname ?? '',
    level: c.level, favorite: c.favorite, hatchedAt: 0,
  }) as unknown as CreatureInstance), [data]);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card">
        <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← {tr('Retour')}</button>
          <button className="btn btn-pink btn-sm" onClick={onGift} disabled={friend.gift_sent_today}><Icon name="gift" />{friend.gift_sent_today ? tr('Cadeau envoyé') : tr('Laisser un cadeau')}</button>
        </div>
        <h2 style={{ marginTop: 10 }}>{tr('Sanctuaire de')} {shownName(data?.name ?? friend.name)}</h2>
        {data && <p className="soft" style={{ fontSize: 14 }}>{tp(data.creatureCount, '{n} créature', '{n} créatures')} · {tr('{dex}/40 espèces découvertes', { dex: data.dex })}</p>}
        {!data ? <p className="soft" style={{ marginTop: 12 }}>{tr('Ce gardien n\'a pas encore sauvegardé son sanctuaire en ligne.')}</p> : (
          <div style={{ marginTop: 12 }}>
            {creatures.length > 0 ? <SanctuaryScene creatures={creatures} visit={data.sanctuary} /> : <p className="soft">{tr('Son sanctuaire attend encore ses premiers habitants.')}</p>}
          </div>
        )}
      </div>
      {data && creatures.length > 0 && (
        <div className="card">
          <div className="card-title"><Icon name="paw" /><h3>{tr('Ses créatures préférées')}</h3></div>
          <div className="visit-grid">
            {data.creatures.map((c) => (
              <div key={c.uid} className="visit-cell">
                <CreatureArt speciesId={c.speciesId} mutations={c.mutations} hue={c.hue} size={72} anim="idle" seed={c.uid} />
                <b>{c.nickname || ''}</b><span className="muted" style={{ fontSize: 12 }}>{tr('Niv. {lvl}', { lvl: c.level })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
