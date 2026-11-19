import { CreatureArt } from '../art/CreatureArt';
import { Icon, type IconName } from '../art/Icons';
import type { Route } from '../../store/uiStore';
import { useGame } from '../../store/gameStore';
import { isDiscovered } from '@core/systems/dex';

interface Plan { title: string; icon: IconName; phase: number; pitch: string; features: string[]; ready: string[]; art: string[] }

const PLANS: Partial<Record<Route, Plan>> = {
  exploration: {
    title: 'Exploration des biomes', icon: 'compass', phase: 4, art: ['zephyrin', 'sphingres', 'frimelot'],
    pitch: 'Envoie tes créatures en expédition dans huit biomes pour y trouver des œufs exclusifs, des ressources et des secrets.',
    features: ['Forêt enchantée, Volcan ancestral, Montagnes gelées, Royaume sous-marin', 'Dimension cosmique, Marais toxique, Désert ancien, Vallée des ombres', 'Expéditions minutées, météo dynamique et zones secrètes', 'Quêtes de biome et événements'],
    ready: ['Cycle jour/nuit déjà actif (influence les mutations)', 'Œufs et créatures thématiques par biome déjà présents'],
  },
  arene: {
    title: 'Arène', icon: 'swords', phase: 5, art: ['fournaillon', 'orageline', 'clapotine'],
    pitch: 'Combats au tour par tour en équipe : avantages élémentaires, compétences, statuts, boss et classements.',
    features: ['Équipes de 3 créatures, énergie et compétences', 'Table des avantages élémentaires', 'Combats PNJ, arènes et boss', 'Récompenses et classements'],
    ready: ['Statistiques calculées (base d\'espèce + gènes + niveau + personnalité + mutations)', 'Table des forces élémentaires déjà définie', 'Animation d\'attaque visible dans chaque fiche créature'],
  },
  communaute: {
    title: 'Communauté', icon: 'people', phase: 6, art: ['lucilet', 'songelin', 'lichenou'],
    pitch: 'Comptes, amis, visites de sanctuaires, échanges sécurisés côté serveur, marché, classements et découvertes mondiales.',
    features: ['Comptes et synchronisation entre appareils', 'Amis et visites de sanctuaires', 'Échanges et marché validés par le serveur (anti-duplication)', 'Événements communautaires et premières découvertes mondiales'],
    ready: ['Toutes les actions passent par un réducteur pur, rejouable côté serveur', 'Journal des transactions déjà tenu', 'Export / import de sauvegarde disponible dans le Profil'],
  },
};

export function ComingSoonScreen({ route }: { route: Route }) {
  const state = useGame((s) => s.state);
  const p = PLANS[route];
  if (!p) return null;
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card soon-hero">
        <div className="soon-art">{p.art.map((s, i) => <CreatureArt key={s} speciesId={s} size={i === 1 ? 130 : 96} silhouette={!isDiscovered(state, s)} anim={isDiscovered(state, s) ? 'idle' : 'none'} />)}</div>
        <span className="badge soft-badge"><Icon name="clock" />En développement — Phase {p.phase}</span>
        <h2>{p.title}</h2>
        <p className="soft" style={{ maxWidth: 560 }}>{p.pitch}</p>
      </div>
      <div className="soon-grid">
        <div className="card"><div className="card-title"><Icon name={p.icon} /><h3>Prévu</h3></div><ul className="soon-list">{p.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
        <div className="card"><div className="card-title"><Icon name="check" /><h3>Déjà en place</h3></div><ul className="soon-list ok">{p.ready.map((f) => <li key={f}>{f}</li>)}</ul></div>
      </div>
      <p className="muted" style={{ fontSize: 13, textAlign: 'center' }}>Cette section n'est pas encore jouable : rien n'y est simulé.</p>
    </div>
  );
}
