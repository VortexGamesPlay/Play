// Notifications PayPal (remboursements, litiges). La signature est vérifiée auprès de PayPal avant tout traitement.
import { admin, handler, HttpError, json, paypal } from '../_shared/common.ts';

Deno.serve(handler(async (req) => {
  const raw = await req.text();
  const event = JSON.parse(raw || '{}');
  const h = (k: string) => req.headers.get(k) ?? '';
  const { data } = await paypal<{ verification_status?: string }>('/v1/notifications/verify-webhook-signature', {
    auth_algo: h('paypal-auth-algo'), cert_url: h('paypal-cert-url'), transmission_id: h('paypal-transmission-id'),
    transmission_sig: h('paypal-transmission-sig'), transmission_time: h('paypal-transmission-time'),
    webhook_id: Deno.env.get('PAYPAL_WEBHOOK_ID'), webhook_event: event,
  });
  if (data.verification_status !== 'SUCCESS') throw new HttpError(400, 'Signature invalide.');

  if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED' || event.event_type === 'PAYMENT.CAPTURE.REVERSED') {
    // Pour un remboursement, l'identifiant de l'encaissement d'origine figure dans les liens « up ».
    const captureId = event.resource?.links?.find((l: { rel: string; href: string }) => l.rel === 'up')?.href?.split('/').pop() ?? event.resource?.id;
    if (captureId) await admin().from('purchases').update({ status: 'refunded' }).eq('capture_id', captureId);
  }
  return json({ received: true });
}));
