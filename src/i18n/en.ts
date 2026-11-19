/**
 * Traductions anglaises. Clé = texte français exact du code ou des données ; valeur = texte anglais.
 * Fichiers séparés par domaine pour rester lisibles.
 */
import { EN_UI } from './en.ui';
import { EN_CONTENT } from './en.content';

export const EN: Record<string, string> = { ...EN_CONTENT, ...EN_UI };
