import { fetchServerPurchases, paymentsConfig } from '../../services/payments';
import { useGame } from '../../store/gameStore';

/**
 * Récupère les achats encaissés sur le serveur et crédite ceux qui ne le sont pas encore
 * (paiement interrompu avant le crédit, ou nouvel appareil avec le même compte).
 */
export async function restorePurchases(): Promise<number> {
  if (!paymentsConfig.paypal) return 0;
  const receipts = await fetchServerPurchases();
  const { state, dispatch } = useGame.getState();
  let applied = 0;
  for (const r of receipts) {
    if (state.premium.purchases.some((p) => p.orderId === r.orderId)) continue;
    if (dispatch({ type: 'applyPurchase', purchase: r })) applied++;
  }
  return applied;
}
