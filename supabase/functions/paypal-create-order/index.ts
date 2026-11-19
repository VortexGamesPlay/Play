// Crée une commande PayPal pour un produit du catalogue.
// Le PRIX vient du catalogue serveur : le client n'envoie que l'identifiant du produit.
import { admin, CURRENCY, handler, HttpError, json, paypal, PRODUCTS, requireUser } from '../_shared/common.ts';

Deno.serve(handler(async (req) => {
  const user = await requireUser(req);
  const { productId } = await req.json().catch(() => ({}));
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) throw new HttpError(400, 'Produit inconnu.');

  const db = admin();
  if (product.once) {
    const { count } = await db.from('purchases').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('product_id', product.id).eq('status', 'captured');
    if ((count ?? 0) > 0) throw new HttpError(409, 'Tu possèdes déjà cet article.');
  }

  const { status, data } = await paypal<{ id?: string }>('/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: product.id,
      custom_id: user.id,
      description: `EGGVERSE — ${product.name}`,
      amount: { currency_code: CURRENCY, value: (product.priceCents / 100).toFixed(2) },
    }],
  }, crypto.randomUUID());
  if (status >= 300 || !data.id) throw new HttpError(502, 'PayPal a refusé la création de la commande.');

  const { error } = await db.from('purchases').insert({
    user_id: user.id, order_id: data.id, product_id: product.id,
    amount_cents: product.priceCents, currency: CURRENCY, provider: 'paypal', status: 'created',
  });
  if (error) throw new HttpError(500, 'Enregistrement de la commande impossible.');
  return json({ orderId: data.id });
}));
