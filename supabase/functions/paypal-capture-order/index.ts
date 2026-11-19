// Encaisse une commande approuvée par le joueur, VÉRIFIE le montant et la devise auprès de PayPal,
// puis enregistre l'achat. Idempotent : rappeler la fonction pour une commande déjà encaissée renvoie le même reçu.
import { admin, handler, HttpError, json, paypal, PRODUCTS, requireUser, toCents } from '../_shared/common.ts';

interface Capture { id: string; status: string; amount: { value: string; currency_code: string } }
interface CaptureResult { status?: string; purchase_units?: { reference_id: string; payments?: { captures?: Capture[] } }[] }

Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  const { orderId } = await req.json().catch(() => ({}));
  if (typeof orderId !== 'string') throw new HttpError(400, 'Commande manquante.');

  const db = admin();
  const { data: row } = await db.from('purchases').select('*').eq('order_id', orderId).eq('user_id', user.id).maybeSingle();
  if (!row) throw new HttpError(404, 'Commande introuvable.');
  const receipt = { orderId, productId: row.product_id, amountCents: row.amount_cents, currency: row.currency };
  if (row.status === 'captured') return json(receipt);
  if (row.status !== 'created') throw new HttpError(409, 'Cette commande n\'est plus valable.');

  const { status, data } = await paypal<CaptureResult>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {}, `capture-${orderId}`);
  const unit = data.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const product = PRODUCTS.find((p) => p.id === row.product_id);
  const ok = status < 300 && data.status === 'COMPLETED' && capture?.status === 'COMPLETED'
    && unit?.reference_id === row.product_id && product
    && toCents(capture.amount.value) === product.priceCents && capture.amount.currency_code === row.currency;

  if (!ok) {
    await db.from('purchases').update({ status: 'failed', raw: data }).eq('id', row.id);
    throw new HttpError(402, 'Le paiement n\'a pas pu être confirmé. Aucun montant n\'a été débité.');
  }
  await db.from('purchases').update({ status: 'captured', capture_id: capture!.id, captured_at: new Date().toISOString(), raw: data }).eq('id', row.id);
  return json(receipt);
}));
