import catalog from '../../supabase/functions/_shared/catalog.json';
import type { ItemId } from '@core/types';

/**
 * Catalogue des achats en argent réel. SOURCE UNIQUE partagée avec le serveur
 * (supabase/functions/_shared/catalog.json) : le serveur ne fait jamais confiance au prix envoyé par le client.
 * Règles : aucune créature ni aucun œuf aléatoire n'est vendu ; tout l'avantage de jeu reste obtenable gratuitement.
 */
export interface ProductGrants {
  crystals?: number;
  items?: Partial<Record<ItemId, number>>;
  decorations?: string[];
  themes?: string[];
  season?: string;
}

export interface ProductDef {
  id: string;
  name: string;
  kind: 'crystals' | 'bundle' | 'season' | 'cosmetic';
  priceCents: number;
  once: boolean;
  grants: ProductGrants;
  badge?: string;
}

export const CURRENCY = catalog.currency;
export const PRODUCTS: ProductDef[] = catalog.products as ProductDef[];
export const PRODUCT_BY_ID: Record<string, ProductDef> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: CURRENCY });
}
