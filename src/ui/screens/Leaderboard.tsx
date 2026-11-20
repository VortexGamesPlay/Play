import { useEffect, useState } from 'react';
import { Icon } from '../art/Icons';
import { tr } from '../../i18n';
import { currentAccount, getClient, serverAvailable } from '../../services/supabase';

type Board = 'tower' | 'wins' | 'dex';
interface Row { user_id: string; name: string; tower: number; wins: number; dex: number }

const LABELS: Record<Board, string> = { tower: 'Tour des épreuves', wins: 'Victoires', dex: 'Bestiaire' };

/** Classements mondiaux, calculés par le serveur à partir des sauvegardes en ligne. */
export function Leaderboard() {
  const [board, setBoard] = useState<Board>('tower');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!serverAvailable()) return;
    let alive = true;
    setRows(null); setError(false);
    void (async () => {
      try {
        const [client, acc] = await Promise.all([getClient(), currentAccount()]);
        const { data, error: e } = await client.from('leaderboard').select('user_id, name, tower, wins, dex').gt(board, 0).order(board, { ascending: false }).order('updated_at').limit(20);
        if (e) throw e;
        if (alive) { setRows(data as Row[]); setMe(acc?.userId ?? null); }
      } catch { if (alive) setError(true); }
    })();
    return () => { alive = false; };
  }, [board]);

  if (!serverAvailable()) return null;
  return (
    <div className="card">
      <div className="card-title"><Icon name="trophy" /><h3>{tr('Classements mondiaux')}</h3></div>
      <div className="tabs small" style={{ marginBottom: 10 }}>
        {(Object.keys(LABELS) as Board[]).map((b) => <button key={b} className={board === b ? 'active' : ''} onClick={() => setBoard(b)}>{tr(LABELS[b])}</button>)}
      </div>
      {error ? <p className="muted" style={{ fontSize: 13 }}>{tr('Classement indisponible (hors ligne ?).')}</p>
        : rows === null ? <p className="muted" style={{ fontSize: 13 }}>{tr('Chargement…')}</p>
        : rows.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>{tr('Personne n\'est encore classé. Sois le premier !')}</p>
        : (
          <ol className="leaderboard">
            {rows.map((r, i) => (
              <li key={r.user_id} className={r.user_id === me ? 'me' : ''}>
                <span className="lb-rank num">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                <span className="lb-name">{r.name === 'Gardien' ? tr('Gardien (nom par défaut)') : r.name}{r.user_id === me ? ` · ${tr('toi')}` : ''}</span>
                <b className="lb-score num">{board === 'tower' ? tr('Étage {n}', { n: r.tower }) : board === 'wins' ? r.wins : `${r.dex}/40`}</b>
              </li>
            ))}
          </ol>
        )}
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{tr('Mis à jour automatiquement à chaque sauvegarde en ligne. Change ton nom de gardien dans le Profil.')}</p>
    </div>
  );
}
